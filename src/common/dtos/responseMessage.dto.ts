import { Expose } from "class-transformer";

export class ResponseMessage {
    @Expose()
    message: string;
}