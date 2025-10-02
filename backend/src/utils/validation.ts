import Joi from 'joi';
import { Role, PracticeType, PracticeStatus, Priority } from '@prisma/client';

// Auth validation schemas
export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Email non valida',
    'any.required': 'Email richiesta',
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password deve essere di almeno 6 caratteri',
    'any.required': 'Password richiesta',
  }),
});

export const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Email non valida',
    'any.required': 'Email richiesta',
  }),
  password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])')).required().messages({
    'string.min': 'Password deve essere di almeno 8 caratteri',
    'string.pattern.base': 'Password deve contenere almeno una lettera minuscola, una maiuscola e un numero',
    'any.required': 'Password richiesta',
  }),
  firstName: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Nome deve essere di almeno 2 caratteri',
    'string.max': 'Nome non può superare 50 caratteri',
    'any.required': 'Nome richiesto',
  }),
  lastName: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Cognome deve essere di almeno 2 caratteri',
    'string.max': 'Cognome non può superare 50 caratteri',
    'any.required': 'Cognome richiesto',
  }),
  role: Joi.string().valid(...Object.values(Role)).optional(),
});

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'any.required': 'Password corrente richiesta',
  }),
  newPassword: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])')).required().messages({
    'string.min': 'Nuova password deve essere di almeno 8 caratteri',
    'string.pattern.base': 'Nuova password deve contenere almeno una lettera minuscola, una maiuscola e un numero',
    'any.required': 'Nuova password richiesta',
  }),
});

export const passwordResetSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Email non valida',
    'any.required': 'Email richiesta',
  }),
});

// Client validation schemas
export const createClientSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Nome deve essere di almeno 2 caratteri',
    'string.max': 'Nome non può superare 50 caratteri',
    'any.required': 'Nome richiesto',
  }),
  lastName: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Cognome deve essere di almeno 2 caratteri',
    'string.max': 'Cognome non può superare 50 caratteri',
    'any.required': 'Cognome richiesto',
  }),
  email: Joi.string().email().optional().allow(null, ''),
  phone: Joi.string().optional().allow(null, ''),
  whatsappNumber: Joi.string().optional().allow(null, ''),
  fiscalCode: Joi.string().length(16).uppercase().optional().allow(null, '').messages({
    'string.length': 'Codice fiscale deve essere di 16 caratteri',
  }),
  vatNumber: Joi.string().min(11).max(11).optional().allow(null, '').messages({
    'string.min': 'Partita IVA deve essere di 11 cifre',
    'string.max': 'Partita IVA deve essere di 11 cifre',
  }),
  address: Joi.string().max(200).optional().allow(null, ''),
  city: Joi.string().max(100).optional().allow(null, ''),
  province: Joi.string().length(2).uppercase().optional().allow(null, ''),
  postalCode: Joi.string().max(10).optional().allow(null, ''),
  country: Joi.string().length(2).uppercase().optional().default('IT'),
  birthDate: Joi.date().optional().allow(null, ''),
  birthPlace: Joi.string().max(100).optional().allow(null, ''),
  notes: Joi.string().max(1000).optional().allow(null, ''),
});

export const updateClientSchema = createClientSchema.fork(
  ['firstName', 'lastName'],
  (schema) => schema.optional()
);

// Practice validation schemas
export const createPracticeSchema = Joi.object({
  title: Joi.string().min(3).max(200).required().messages({
    'string.min': 'Titolo deve essere di almeno 3 caratteri',
    'string.max': 'Titolo non può superare 200 caratteri',
    'any.required': 'Titolo richiesto',
  }),
  type: Joi.string().valid(...Object.values(PracticeType)).required().messages({
    'any.only': 'Tipo pratica non valido',
    'any.required': 'Tipo pratica richiesto',
  }),
  clientId: Joi.string().required().messages({
    'any.required': 'Cliente richiesto',
  }),
  description: Joi.string().max(2000).optional().allow(null, ''),
  startDate: Joi.date().optional().default(() => new Date()),
  dueDate: Joi.date().optional().allow(null),
  amount: Joi.number().positive().precision(2).optional().allow(null),
  priority: Joi.string().valid(...Object.values(Priority)).optional().default('MEDIUM'),
});

export const updatePracticeSchema = Joi.object({
  title: Joi.string().min(3).max(200).optional(),
  type: Joi.string().valid(...Object.values(PracticeType)).optional(),
  status: Joi.string().valid(...Object.values(PracticeStatus)).optional(),
  priority: Joi.string().valid(...Object.values(Priority)).optional(),
  description: Joi.string().max(2000).optional().allow(null, ''),
  dueDate: Joi.date().optional().allow(null),
  amount: Joi.number().positive().precision(2).optional().allow(null),
  paidAmount: Joi.number().min(0).precision(2).optional().allow(null),
  isPaid: Joi.boolean().optional(),
  invoiceNumber: Joi.string().max(50).optional().allow(null, ''),
});

// Query validation schemas
export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).optional().default(1),
  limit: Joi.number().integer().min(1).max(100).optional().default(10),
  search: Joi.string().max(100).optional().allow(''),
  sortBy: Joi.string().max(50).optional(),
  sortOrder: Joi.string().valid('asc', 'desc').optional().default('desc'),
});

export const clientQuerySchema = paginationSchema.keys({
  isActive: Joi.boolean().optional(),
  city: Joi.string().max(100).optional(),
  province: Joi.string().length(2).optional(),
});

export const practiceQuerySchema = paginationSchema.keys({
  clientId: Joi.string().optional(),
  type: Joi.string().valid(...Object.values(PracticeType)).optional(),
  status: Joi.string().valid(...Object.values(PracticeStatus)).optional(),
  priority: Joi.string().valid(...Object.values(Priority)).optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  isPaid: Joi.boolean().optional(),
});

// Validation helper functions
export const validateLoginInput = (data: any) => loginSchema.validate(data);
export const validateRegisterInput = (data: any) => registerSchema.validate(data);
export const validateChangePasswordInput = (data: any) => changePasswordSchema.validate(data);
export const validatePasswordResetInput = (data: any) => passwordResetSchema.validate(data);

export const validateCreateClient = (data: any) => createClientSchema.validate(data);
export const validateUpdateClient = (data: any) => updateClientSchema.validate(data);

export const validateCreatePractice = (data: any) => createPracticeSchema.validate(data);
export const validateUpdatePractice = (data: any) => updatePracticeSchema.validate(data);

export const validatePagination = (data: any) => paginationSchema.validate(data);
export const validateClientQuery = (data: any) => clientQuerySchema.validate(data);
export const validatePracticeQuery = (data: any) => practiceQuerySchema.validate(data);

// ID validation
export const validateId = (id: string) => {
  const schema = Joi.string().required();
  return schema.validate(id);
};
