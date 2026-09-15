# Integração com o n8n (canal de testes)

O CRM expõe um canal genérico para automações no n8n, nos dois sentidos:

| Sentido | Como funciona | Variável |
|---|---|---|
| **n8n → CRM** | O n8n faz `POST` em `/api/n8n/inbound/:evento` com o cabeçalho `X-API-Key`. O payload é registrado no CRM. | `N8N_API_KEY` |
| **CRM → n8n** | O CRM faz `POST` no nó Webhook do n8n, com assinatura opcional em `X-CRM-Signature`. | `N8N_WEBHOOK_URL`, `N8N_WEBHOOK_SECRET` |

Nenhum dos dois é obrigatório: configure só o sentido que o seu fluxo usa. Toda troca
(entrada e saída) fica registrada na tabela `n8n_events` e aparece em
**Configurações › Integrações › n8n › Últimas trocas**.

> Nesta etapa o CRM **recebe e registra** o payload — ele ainda não cria fornecedores
> nem cotações a partir dele. Com o formato do seu fluxo validado no log, a próxima
> etapa é transformar esses dados em registros do CRM.

## 1. Configurar o servidor

No `.env` do CRM:

```bash
# Chave que o n8n usará para gravar no CRM
N8N_API_KEY=cole-aqui-a-chave-gerada
# URL do nó Webhook do n8n que recebe eventos do CRM
N8N_WEBHOOK_URL=https://seu-n8n.exemplo.com/webhook/3b8d9af8-6a55-49cc-8f8c-c04d5ca54470
# Opcional: assina o corpo enviado (recomendado)
N8N_WEBHOOK_SECRET=cole-aqui-um-segredo
N8N_TIMEOUT_MS=10000
```

Gere a chave e o segredo com:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Depois aplique a migração e reinicie o servidor:

```bash
npm run migrate
```

A chave nunca é gravada no banco nem exibida na interface.

## 2. Testar a conexão

### 2.1 n8n → CRM (entrada)

Confira a chave:

```bash
curl -s https://seu-crm.exemplo.com/api/n8n/ping -H "X-API-Key: $N8N_API_KEY"
# {"ok":true,"service":"crm","time":"..."}
```

Envie uma lista de fornecedores:

```bash
curl -s -X POST https://seu-crm.exemplo.com/api/n8n/inbound/fornecedores.lista \
  -H "X-API-Key: $N8N_API_KEY" -H "Content-Type: application/json" \
  -d '{"fornecedores":[
        {"nome":"Aço Forte Ltda","cnpj":"11222333000181","email":"vendas@acoforte.com"},
        {"nome":"Metal Sul","cnpj":"33444555000155","email":"comercial@metalsul.com"}]}'
# {"ok":true,"delivery_id":1,"event":"fornecedores.lista","items":2,...}
```

No n8n, o mesmo pedido é um nó **HTTP Request**:

- **Method**: `POST`
- **URL**: `https://seu-crm.exemplo.com/api/n8n/inbound/fornecedores.lista`
- **Headers**: `X-API-Key` = valor de `N8N_API_KEY`
- **Body Content Type**: `JSON`

O nome do evento é livre (minúsculas, números, `.`, `-`, `_`, até 60 caracteres) —
use um por etapa do fluxo, por exemplo `fornecedores.lista`, `cotacao.resposta`.

O corpo pode ser um objeto ou uma lista. A contagem de itens é preenchida
automaticamente quando o payload é uma lista na raiz ou tem uma das chaves
`items`, `data`, `fornecedores`, `suppliers` ou `results`.

Respostas possíveis: `202` recebido, `400` evento ou corpo inválido, `401` chave
inválida, `429` acima de 120 requisições por minuto, `503` `N8N_API_KEY` não definida.

### 2.2 CRM → n8n (saída)

Pela interface: **Configurações › Integrações › n8n › Enviar evento de teste**
(perfil administrador ou supervisor). O resultado aparece na hora em "Últimas trocas".

O n8n recebe:

```json
{
  "event": "teste.conexao",
  "sent_at": "2026-01-01T12:00:00.000Z",
  "delivery_id": 12,
  "data": { "origem": "CRM", "disparado_por": { "id": 1, "nome": "Admin" } }
}
```

com os cabeçalhos `X-CRM-Event`, `X-CRM-Delivery` e, quando `N8N_WEBHOOK_SECRET`
está definido, `X-CRM-Signature: sha256=<hmac-sha256 do corpo>`.

**URL de teste x URL de produção do n8n:** o endereço `/webhook-test/<id>` só
responde enquanto o workflow está aberto no editor com "Listen for test event"
ativo; fora disso ele devolve 404. Para uso contínuo, ative o workflow e use a URL
`/webhook/<id>`.

Para conferir a assinatura dentro do n8n (nó **Code**):

```js
const crypto = require('crypto');
const segredo = 'o mesmo N8N_WEBHOOK_SECRET';
const corpo = JSON.stringify($input.first().json);
const esperado = 'sha256=' + crypto.createHmac('sha256', segredo).update(corpo).digest('hex');
// compare com o cabeçalho X-CRM-Signature recebido
```

> A verificação acima só bate se o nó Webhook estiver com **Raw Body** ativo; caso
> contrário o n8n reserializa o JSON e a assinatura muda. Sem Raw Body, use a
> assinatura apenas como indicação e mantenha a URL do webhook secreta.

## 3. Aba Fornecedores (busca para cotação)

O menu **Fornecedores** abre a tela onde a operadora pesquisa por **nicho, nome,
cidade e bairro**. Ao clicar em *Buscar*, o CRM envia ao webhook do n8n:

```json
{
  "event": "fornecedores.buscar",
  "sent_at": "2026-01-01T12:00:00.000Z",
  "delivery_id": 34,
  "data": {
    "nicho": "material elétrico",
    "nome": null,
    "cidade": "São Paulo",
    "bairro": "Mooca",
    "limite": 50,
    "solicitado_por": { "id": 3, "nome": "Operadora" }
  }
}
```

e exibe a lista que o n8n devolver **na resposta da mesma requisição**.

### Como montar o fluxo no n8n

1. Nó **Webhook**: método `POST`, e em *Respond* escolha **Using 'Respond to Webhook' node**.
2. No meio, a sua lógica (Google Maps, planilha, banco, API de fornecedores...),
   usando `{{ $json.data.nicho }}`, `{{ $json.data.cidade }}`, `{{ $json.data.bairro }}`
   e `{{ $json.data.nome }}` como filtros.
3. Nó **Respond to Webhook**: devolva uma lista de objetos, por exemplo:

```json
[
  { "nome": "Elétrica Central", "nicho": "Material elétrico", "telefone": "(11) 3333-4444",
    "cidade": "São Paulo", "bairro": "Mooca", "site": "https://exemplo.com.br" },
  { "nome": "Luz & Cia", "telefone": "11999998888", "email": "vendas@luzecia.com",
    "cidade": "São Paulo", "bairro": "Mooca" }
]
```

O CRM aceita a lista na raiz, em `{"data":[...]}`, `{"fornecedores":[...]}`,
`{"items":[...]}`, `{"results":[...]}` ou `{"lista":[...]}`, com ou sem o embrulho
`{"json": {...}}` de cada item do n8n. Os nomes de campo são reconhecidos em
português e inglês:

| Campo exibido | Nomes aceitos |
|---|---|
| Nome | `nome`, `name`, `nome_fantasia`, `razao_social`, `empresa`, `title`, `titulo` |
| Nicho | `nicho`, `categoria`, `category`, `segmento`, `ramo`, `tipo`, `type` |
| Telefone | `telefone`, `phone`, `fone`, `celular`, `whatsapp`, `phone_number` |
| E-mail | `email`, `e_mail`, `mail` |
| Cidade | `cidade`, `city`, `municipio` |
| Bairro | `bairro`, `neighborhood`, `distrito`, `district` |
| Endereço | `endereco`, `address`, `logradouro`, `rua` |
| Site | `site`, `website`, `url`, `link`, `pagina` |
| Avaliação | `avaliacao`, `rating`, `nota`, `stars` |
| CNPJ/CPF | `cnpj`, `documento`, `document`, `cpf` |

Itens sem nome, telefone e e-mail são descartados. Campos não reconhecidos não
atrapalham: o objeto original fica guardado no log da troca.

Na lista, cada fornecedor traz **Abrir WhatsApp** e **Cadastrar cliente** — este
último cria o cadastro no CRM com a origem `n8n` e as etiquetas `fornecedor` e o
nicho. Enquanto não houver o cadastro, nada da busca é gravado no CRM.

A busca espera a resposta por até 60 segundos (`N8N_SEARCH_TIMEOUT_MS`). Fluxos mais
demorados devem responder rápido e devolver o resultado depois por
`POST /api/n8n/inbound/...`.

> A URL `/webhook-test/<id>` só responde com o editor do n8n aberto em "Listen for
> test event". Para a operadora usar no dia a dia, ative o workflow e configure
> `N8N_WEBHOOK_URL` com a URL de produção `/webhook/<id>`.

## 4. Ver o log das trocas

Na interface: **Configurações › Integrações › n8n**. Pela API (admin ou supervisor):

```bash
GET /api/n8n/events?limit=50&direction=entrada&event=fornecedores.lista
GET /api/n8n/events/:id     # payload completo daquela troca
```

Cada linha traz o sentido, o evento, a quantidade de itens, a situação
(`ok`, `erro`, `pendente`), o status HTTP e a mensagem de erro quando houver.

## 5. Fluxo de cotação (visão geral)

O que já funciona hoje:

1. A operadora pesquisa na aba **Fornecedores** (nicho, nome, cidade, bairro).
2. O CRM consulta o fluxo do n8n e mostra a lista devolvida.
3. A operadora cadastra os escolhidos como clientes (etiqueta `fornecedor`).

O que ainda não existe e é a etapa seguinte:

4. Cadastro próprio de fornecedores e de cotações (hoje o fornecedor vira cliente).
5. Disparo da cotação aos fornecedores pelo n8n e retorno das propostas em
   `POST /api/n8n/inbound/cotacao.resposta` — o canal de entrada já aceita esse
   evento e o registra; falta transformá-lo em cotação dentro do CRM.

Use o log das trocas para validar o formato do payload antes dessa etapa.

## Limites e segurança

- Entrada limitada a 120 requisições por minuto por IP.
- Payload gravado até ~200 KB; acima disso o log guarda uma amostra e marca `_truncado`.
- O endpoint de entrada é isento da proteção CSRF (autentica por chave) e a chave é
  comparada em tempo constante.
- Use HTTPS nas duas pontas: a chave e o segredo trafegam em cabeçalhos.
