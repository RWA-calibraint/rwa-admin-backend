import { PartialType } from '@nestjs/swagger';

import { CreateAssetDto } from 'src/assets/dto/create-asset.dto';

export class UpdateAssetDto extends PartialType(CreateAssetDto) {}
