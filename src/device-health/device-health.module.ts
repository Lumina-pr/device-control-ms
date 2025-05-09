import { Module } from '@nestjs/common';
import { DeviceHealthService } from './device-health.service';
import { DeviceHealthController } from './device-health.controller';

@Module({
  controllers: [DeviceHealthController],
  providers: [DeviceHealthService],
})
export class DeviceHealthModule {}
