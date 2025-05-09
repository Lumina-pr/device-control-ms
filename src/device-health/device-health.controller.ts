import { Controller } from '@nestjs/common';
import { DeviceHealthService } from './device-health.service';
import { MessagePattern, Payload, Transport } from '@nestjs/microservices';

@Controller()
export class DeviceHealthController {
  constructor(private readonly deviceHealthService: DeviceHealthService) {}

  @MessagePattern('device-control.ping', Transport.NATS)
  pingDevice(@Payload() deviceId: string) {
    return this.deviceHealthService.pingDevice(deviceId);
  }
}
