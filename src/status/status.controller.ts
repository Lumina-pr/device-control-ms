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

@Controller()
export class StatusController implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(StatusController.name);
  private interval: NodeJS.Timeout;

  constructor(
    private readonly statusService: StatusService,
    @Inject(NATS_SERVICE) private readonly deviceClient: ClientProxy,
  ) {}

  onModuleInit() {
    // Set interval to emit device status every 3 seconds
    this.interval = setInterval(() => {
      // Generate random values for current and voltage
      const current = parseFloat((Math.random() * 5).toFixed(2));
      const voltage = parseFloat((Math.random() * 220 + 110).toFixed(2));

      // Create device status payload
      const deviceStatus = {
        deviceId: 'esp32-001',
        current,
        voltage,
      };

      this.logger.debug(
        `Emitting device status: ${JSON.stringify(deviceStatus)}`,
      );

      // Emit to the device.status pattern
      this.deviceClient.emit('device.status', deviceStatus);
    }, 3000);
  }

  onModuleDestroy() {
    // Clear the interval when the module is destroyed
    if (this.interval) {
      clearInterval(this.interval);
    }
  }
}
