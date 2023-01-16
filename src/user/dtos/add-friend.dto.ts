import { IsUUID, UUIDVersion } from "class-validator";

  export class AddFriendDto {
  
    @IsUUID()
    requestedToId: UUIDVersion;
    
  }
  