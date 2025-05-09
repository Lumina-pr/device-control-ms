import 'dotenv/config';
import * as joi from 'joi';

interface EnvVars {
  NATS_SERVERS: string[];
  MQTT_URL: string;
}

const envsSchema = joi
  .object({
    NATS_SERVERS: joi.array().items(joi.string()).required(),
    MQTT_URL: joi.string().uri().required(),
  })
  .unknown(true);

const { error, value } = envsSchema.validate({
  ...process.env,
  NATS_SERVERS: process.env.NATS_SERVERS?.split(','),
  MQTT_URL: process.env.MQTT_URL,
});

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const envVars: EnvVars = value;

export const envs = {
  nats: {
    servers: envVars.NATS_SERVERS,
  },
  mqtt: {
    url: envVars.MQTT_URL,
  },
};
