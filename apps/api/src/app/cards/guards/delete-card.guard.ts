import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
  UnauthorizedException
} from "@nestjs/common";
import { Request } from "express";
import { CardsService } from "../cards.service";
import { SetsService } from "../../sets/sets.service";
import { plainToClass } from "class-transformer";
import { validate } from "class-validator";
import { CardIdParam } from "../param/cardId.param";

@Injectable()
export class DeleteCardGuard implements CanActivate {
  constructor(
    private readonly cardsService: CardsService,
    private readonly setsService: SetsService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req: Request = context.switchToHttp().getRequest();
    const param: CardIdParam = req.params as unknown as CardIdParam;

    // guards are executed before pipes -> we have to manually validate body
    if ((await validate(plainToClass(CardIdParam, param))).length > 0) throw new BadRequestException();

    const card = await this.cardsService.card({
      id: param.cardId
    });
    if (!card) throw new NotFoundException();

    if (!(await this.setsService.verifySetOwnership(req, card.setId))) throw new UnauthorizedException();

    return true;
  }
}
