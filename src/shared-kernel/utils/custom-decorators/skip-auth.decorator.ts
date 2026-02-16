import { SetMetadata } from '@nestjs/common';

import { IS_PUBLIC_KEY } from 'src/shared-kernel/utils/constants/decorator-contents';

export const SkipAuth = () => SetMetadata(IS_PUBLIC_KEY, true);
