import { Module } from '@nestjs/common';
import { DeviceHealthModule } from './device-health/device-health.module';
import { StatusModule } from './status/status.module';

@Module({
  imports: [DeviceHealthModule, StatusModule],
})
export class AppModule {}
