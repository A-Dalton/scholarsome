import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Request,
  UnauthorizedException,
  UseGuards
} from "@nestjs/common";
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiCreatedResponse,
  ApiTags,
  ApiUnauthorizedResponse
} from "@nestjs/swagger";
import { Request as ExpressRequest } from "express";
import { ApiResponse, ApiResponseOptions, SrsQueueData, SrsReviewData } from "@scholarsome/shared";
import { AuthService } from "../auth/auth.service";
import { AuthenticatedGuard } from "../auth/guards/authenticated.guard";
import { ErrorResponse } from "../shared/response/error.response";
import { FolderIdParam } from "../folders/param/folderId.param";
import { RateCardDto } from "./dto/rateCard.dto";
import { SrsService } from "./srs.service";
import { SrsQueueSuccessResponse } from "./response/success/srsQueue.success.response";
import { SrsReviewSuccessResponse } from "./response/success/srsReview.success.response";

@ApiTags("SRS")
@Controller("srs")
export class SrsController {
  constructor(
    private readonly authService: AuthService,
    private readonly srsService: SrsService
  ) {}

  /**
   * Gets the full review queue across all folders of the authenticated user
   *
   * @returns Cards scheduled for review and debug statistics
   */
  @ApiOperation({
    summary: "Get the full review queue across all folders",
    description: "Gets all of the cards that are scheduled for review across all folders of the authenticated user, plus statistics regarding the SRS for debug purposes"
  })
  @ApiOkResponse({
    description: "Expected response to a valid request",
    type: SrsQueueSuccessResponse
  })
  @ApiUnauthorizedResponse({
    description: "Invalid authentication to access the requested resource",
    type: ErrorResponse
  })
  @UseGuards(AuthenticatedGuard)
  @Get("queue")
  async queueAll(@Request() req: ExpressRequest): Promise<ApiResponse<SrsQueueData>> {
    const user = await this.authService.getUserInfo(req);
    if (!user) {
      throw new UnauthorizedException({
        status: "fail",
        message: "Invalid authentication to access the requested resource"
      });
    }

    return {
      status: ApiResponseOptions.Success,
      data: await this.srsService.getQueue(user.id)
    };
  }

  /**
   * Gets the review queue of a folder, including all cards scheduled for
   * review within the folder and recursively within its subfolders
   *
   * @returns Cards scheduled for review and debug statistics
   */
  @ApiOperation({
    summary: "Get the review queue of a folder",
    description: "Gets all of the cards that are scheduled for review within a folder and recursively within its subfolders, plus statistics regarding the SRS for debug purposes"
  })
  @ApiOkResponse({
    description: "Expected response to a valid request",
    type: SrsQueueSuccessResponse
  })
  @ApiNotFoundResponse({
    description: "Resource not found or inaccessible",
    type: ErrorResponse
  })
  @ApiUnauthorizedResponse({
    description: "Invalid authentication to access the requested resource",
    type: ErrorResponse
  })
  @UseGuards(AuthenticatedGuard)
  @Get("folders/:folderId/queue")
  async queue(@Param() params: FolderIdParam, @Request() req: ExpressRequest): Promise<ApiResponse<SrsQueueData>> {
    const user = await this.authService.getUserInfo(req);
    if (!user) {
      throw new UnauthorizedException({
        status: "fail",
        message: "Invalid authentication to access the requested resource"
      });
    }

    const queue = await this.srsService.getQueue(user.id, params.folderId);
    if (!queue) {
      throw new NotFoundException({ status: "fail", message: "Folder not found" });
    }

    return {
      status: ApiResponseOptions.Success,
      data: queue
    };
  }

  /**
   * Applies a rating to a card within the SRS
   *
   * @returns New SRS state of the card and debug statistics
   */
  @ApiOperation({
    summary: "Rate a card within the SRS",
    description: "Applies a rating to a card and returns its new SRS state, the review log and debug statistics"
  })
  @ApiCreatedResponse({
    description: "Expected response to a valid request",
    type: SrsReviewSuccessResponse
  })
  @ApiNotFoundResponse({
    description: "Resource not found or inaccessible",
    type: ErrorResponse
  })
  @ApiUnauthorizedResponse({
    description: "Invalid authentication to access the requested resource",
    type: ErrorResponse
  })
  @UseGuards(AuthenticatedGuard)
  @Post("review")
  async review(@Body() body: RateCardDto, @Request() req: ExpressRequest): Promise<ApiResponse<SrsReviewData>> {
    const user = await this.authService.getUserInfo(req);
    if (!user) {
      throw new UnauthorizedException({
        status: "fail",
        message: "Invalid authentication to access the requested resource"
      });
    }

    const result = await this.srsService.rate(user.id, body.cardId, body.rating);
    if (!result) {
      throw new NotFoundException({ status: "fail", message: "Card not found" });
    }

    return {
      status: ApiResponseOptions.Success,
      data: result
    };
  }
}
