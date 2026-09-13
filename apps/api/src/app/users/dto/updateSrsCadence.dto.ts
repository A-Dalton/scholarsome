import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty } from "class-validator";
import { SrsCadence } from "@scholarsome/shared";

export class UpdateSrsCadenceDto {
  @ApiProperty({
    description: "The SRS review cadence to apply to the user",
    enum: SrsCadence,
    example: SrsCadence.ONCE_PER_DAY
  })
  @IsEnum(SrsCadence)
  @IsNotEmpty()
    cadence: SrsCadence;
}
