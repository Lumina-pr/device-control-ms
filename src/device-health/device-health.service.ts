import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as mqtt from 'mqtt';
import { envs } from 'src/config/envs';
import { CustomRpcException } from 'src/interfaces/ErrorResponse';

@Injectable()
export class DeviceHealthService implements OnModuleInit {
  private readonly mqttClient = mqtt.connect(envs.mqtt.url);
  private readonly logger = new Logger(DeviceHealthService.name);

  onModuleInit() {
    this.logger.log('DeviceHealthService initialized');

    this.mqttClient.on('connect', () => {
      this.logger.debug('Connected to MQTT broker');
    });

    this.mqttClient.subscribe('device/energy');
    this.mqttClient.on('message', (topic, message) => {
      this.logger.debug(
        `Received message on topic ${topic}: ${message.toString()}`,
      );
    });
  }

  async pingDevice(deviceId: string) {
    const pingData = { action: 'ping' };

    return new Promise((resolve, reject) => {
      const replyTopic = `device/${deviceId}/ping/reply`;
      const timeout = setTimeout(() => {
        this.mqttClient.unsubscribe(replyTopic);
        this.mqttClient.removeListener('message', messageHandler);
        reject(
          new CustomRpcException(503, `Ping timeout for device ${deviceId}`),
        );
      }, 5000);

      const messageHandler = (topic, message) => {
        if (topic === replyTopic) {
          clearTimeout(timeout);
          this.mqttClient.unsubscribe(replyTopic);
          this.mqttClient.removeListener('message', messageHandler);

          const responseData = JSON.parse(message.toString());
          this.logger.debug(`Pong received from device: ${deviceId}`);
          this.logger.debug(`Response data: ${JSON.stringify(responseData)}`);

          resolve({
            status: 'success',
            message: `Device ${deviceId} is reachable`,
            data: responseData,
          });
        }
      };

      this.mqttClient.subscribe(replyTopic);
      this.mqttClient.on('message', messageHandler);

      // Fixed string interpolation by using backticks instead of single quotes
      this.mqttClient.publish(
        `device/${deviceId}/ping`,
        JSON.stringify(pingData),
        (err) => {
          if (err) {
            clearTimeout(timeout);
            this.mqttClient.unsubscribe(replyTopic);
            this.mqttClient.removeListener('message', messageHandler);
            this.logger.error(`Failed to send ping to device ${deviceId}`, err);
            reject(err);
          } else {
            this.logger.debug(`Ping sent to device: ${deviceId}`);
          }
        },
      );
    });
  }
}
