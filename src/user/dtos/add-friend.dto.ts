import { ApiProperty } from "@nestjs/swagger";
import { IsUUID } from "class-validator";

  export class AddFriendDto {
    @ApiProperty()
    @IsUUID()
    requestedToId: string;
  }
  