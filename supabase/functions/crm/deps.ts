// Dependências npm e módulos nativos do Node usados pelo bundle do CRM (injetados em globalThis.__deps).
import express from 'npm:express@4.21.2';
import helmet from 'npm:helmet@8.0.0';
import session from 'npm:express-session@1.18.1';
import connectPgSimple from 'npm:connect-pg-simple@10.0.0';
import cookieParser from 'npm:cookie-parser@1.4.7';
import dotenv from 'npm:dotenv@16.4.5';
import rateLimit from 'npm:express-rate-limit@7.4.1';
import nodemailer from 'npm:nodemailer@6.9.16';
import * as pg from 'npm:pg@8.13.1';
import bcryptjs from 'npm:bcryptjs@2.4.3';
import * as zod from 'npm:zod@3.23.8';
import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';

const unwrap = (m: any) => (m && m.default !== undefined ? m.default : m);
(globalThis as any).__deps = {
  express: unwrap(express), helmet: unwrap(helmet), 'express-session': unwrap(session), 'connect-pg-simple': unwrap(connectPgSimple),
  'cookie-parser': unwrap(cookieParser), dotenv: unwrap(dotenv), 'express-rate-limit': unwrap(rateLimit), nodemailer: unwrap(nodemailer),
  pg: unwrap(pg), bcryptjs: unwrap(bcryptjs), zod: (zod as any).z ? zod : unwrap(zod),
  crypto: unwrap(crypto), fs: unwrap(fs), path: unwrap(path),
};
