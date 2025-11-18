import { Controller, Get, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { CountryDto } from '../dto/chat.dto';

@ApiTags('Countries')
@Controller('countries')
export class CountriesController {
  @Get()
  @ApiOperation({
    summary: 'Get available countries',
    description: 'Returns list of available countries with codes, flags, and translation keys'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Countries retrieved successfully',
    type: [CountryDto],
    schema: {
      type: 'array',
      items: {
        $ref: getSchemaPath(CountryDto)
      }
    }
  })
  getCountries(): CountryDto[] {
    return [
      { code: 'DE', flag: '🇩🇪', nameKey: 'countries.germany' },
      { code: 'FR', flag: '🇫🇷', nameKey: 'countries.france' },
      { code: 'IT', flag: '🇮🇹', nameKey: 'countries.italy' },
      { code: 'ES', flag: '🇪🇸', nameKey: 'countries.spain' },
      { code: 'GB', flag: '🇬🇧', nameKey: 'countries.united_kingdom' },
      { code: 'NL', flag: '🇳🇱', nameKey: 'countries.netherlands' },
      { code: 'BE', flag: '🇧🇪', nameKey: 'countries.belgium' },
      { code: 'PL', flag: '🇵🇱', nameKey: 'countries.poland' },
    ];
  }
}

