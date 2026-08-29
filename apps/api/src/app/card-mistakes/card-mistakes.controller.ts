import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Request,
  UnauthorizedException,
  NotFoundException,
  UseGuards
} from "@nestjs/common";
import { Request as ExpressRequest } from "express";
import { ApiResponse, ApiResponseOptions } from "@scholarsome/shared";
import { CardMistakesService } from "./card-mistakes.service";
import { AuthService } from "../auth/auth.service";
import { CardsService } from "../cards/cards.service";
import { AuthenticatedGuard } from "../auth/guards/authenticated.guard";
import {
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse
} from "@nestjs/swagger";
import { CreateCardMistakeDto } from "./dto/createCardMistake.dto";
import { CardMistakeIdParam } from "./param/cardMistakeId.param";
import { ErrorResponse } from "../shared/response/error.response";
import { CardMistakesSuccessResponse } from "./response/success/cardMistakes.success.response";

@ApiTags("Card Mistakes")
@Controller("card-mistakes")
export class CardMistakesController {
  constructor(
    private readonly cardMistakesService: CardMistakesService,
    private readonly authService: AuthService,
    private readonly cardsService: CardsService
  ) {}

  /**
   * Gets all of the cards that the current user did not know in progressive mode
   *
   * @returns Array of `CardMistake` objects
   */
  @UseGuards(AuthenticatedGuard)
  @ApiOperation({
    summary: "Get the previous mistakes of the authenticated user"
  })
  @ApiOkResponse({
    description: "Expected response to a valid request",
    type: CardMistakesSuccessResponse
  })
  @ApiUnauthorizedResponse({
    description: "Invalid authentication to access the requested resource",
    type: ErrorResponse
  })
  @Get()
  async mistakes(@Request() req: ExpressRequest): Promise<ApiResponse<unknown[]>> {
    const user = await this.authService.getUserInfo(req);
    if (!user) throw new UnauthorizedException({ status: "fail", message: "Invalid authentication to access the requested resource" });

    return {
      status: ApiResponseOptions.Success,
      data: await this.cardMistakesService.cardMistakes({
        where: {
          userId: user.id
        },
        orderBy: {
          createdAt: "desc"
        }
      })
    };
  }

  /**
   * Stores a card that the user did not know in progressive mode
   *
   * @returns Created `CardMistake` object
   */
  @UseGuards(AuthenticatedGuard)
  @ApiOperation({
    summary: "Store a card as a previous mistake"
  })
  @ApiCreatedResponse({
    description: "Expected response to a valid request",
    type: CardMistakesSuccessResponse
  })
  @ApiNotFoundResponse({
    description: "Resource not found or inaccessible",
    type: ErrorResponse
  })
  @ApiUnauthorizedResponse({
    description: "Invalid authentication to access the requested resource",
    type: ErrorResponse
  })
  @Post()
  async createMistake(@Body() body: CreateCardMistakeDto, @Request() req: ExpressRequest): Promise<ApiResponse<unknown>> {
    const user = await this.authService.getUserInfo(req);
    if (!user) throw new UnauthorizedException({ status: "fail", message: "Invalid authentication to access the requested resource" });

    const card = await this.cardsService.card({ id: body.cardId });
    if (!card) throw new NotFoundException({ status: "fail", message: "Card not found" });

    return {
      status: ApiResponseOptions.Success,
      data: await this.cardMistakesService.createCardMistake({
        user: {
          connect: {
            id: user.id
          }
        },
        card: {
          connect: {
            id: card.id
          }
        },
        set: {
          connect: {
            id: card.setId
          }
        },
        term: card.term,
        definition: card.definition
      })
    };
  }

  /**
   * Deletes a previous mistake of the authenticated user
   *
   * @param params Object containing the ID of the card mistake to delete
   *
   * @returns Deleted `CardMistake` object
   */
  @UseGuards(AuthenticatedGuard)
  @ApiOperation({
    summary: "Delete a previous mistake of the authenticated user"
  })
  @ApiOkResponse({
    description: "Expected response to a valid request",
    type: CardMistakesSuccessResponse
  })
  @ApiNotFoundResponse({
    description: "Resource not found or inaccessible",
    type: ErrorResponse
  })
  @ApiUnauthorizedResponse({
    description: "Invalid authentication to access the requested resource",
    type: ErrorResponse
  })
  @Delete(":cardMistakeId")
  async deleteMistake(@Param() params: CardMistakeIdParam, @Request() req: ExpressRequest): Promise<ApiResponse<unknown>> {
    const user = await this.authService.getUserInfo(req);
    if (!user) throw new UnauthorizedException({ status: "fail", message: "Invalid authentication to access the requested resource" });

    const mistake = await this.cardMistakesService.cardMistake({
      id: params.cardMistakeId
    });
    if (!mistake || mistake.userId !== user.id) {
      throw new NotFoundException({ status: "fail", message: "Card mistake not found" });
    }

    return {
      status: ApiResponseOptions.Success,
      data: await this.cardMistakesService.deleteCardMistake({
        id: params.cardMistakeId
      })
    };
  }
}
