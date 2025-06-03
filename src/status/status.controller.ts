import {
  Controller,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { StatusService } from './status.service';
import { Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { NATS_SERVICE } from 'src/config/services';
import * as mqtt from 'mqtt';
import { envs } from 'src/config/envs';

@Controller()
export class StatusController implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(StatusController.name);
  private readonly mqttClient = mqtt.connect(envs.mqtt.url);

  constructor(
    private readonly statusService: StatusService,
    @Inject(NATS_SERVICE) private readonly deviceClient: ClientProxy,
  ) {}

  onModuleInit() {
    // Connect to MQTT and subscribe to device pulse
    this.mqttClient.on('connect', () => {
      this.logger.debug('Connected to MQTT broker');

      // Subscribe to all device pulse topics using wildcard
      this.mqttClient.subscribe('device/+/pulse');
      this.logger.debug('Subscribed to device/+/pulse');
    });

    // Handle incoming MQTT messages
    this.mqttClient.on('message', (topic, message) => {
      // Extract deviceId from topic - format is "device/{deviceId}/pulse"
      const topicParts = topic.split('/');
      if (
        topicParts.length === 3 &&
        topicParts[0] === 'device' &&
        topicParts[2] === 'pulse'
      ) {
        const deviceId = topicParts[1];

        try {
          const pulseData = JSON.parse(message.toString());
          this.logger.debug(
            `Received pulse from device ${deviceId}: ${JSON.stringify(
              pulseData,
            )}`,
          );

          // Emit the pulse data to NATS
          this.deviceClient.emit('device.status', {
            deviceId,
            current: pulseData.data.current,
            voltage: pulseData.data.voltage,
          });

          this.logger.debug(`Pulse data from ${deviceId} forwarded to NATS`);
        } catch (error) {
          this.logger.error(
            `Error processing pulse message from ${deviceId}: ${error.message}`,
          );
        }
      }
    });
  }

  onModuleDestroy() {
    // Close MQTT connection
    if (this.mqttClient) {
      this.mqttClient.end();
      this.logger.debug('MQTT connection closed');
    }
  }
}
