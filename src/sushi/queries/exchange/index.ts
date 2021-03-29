import * as token from './token';
import * as pair from './pair';
import * as factory from './factory';
import * as eth from './eth';

export default {
    ...token,
    ...pair,
    ...factory,
    ...eth,
}

export * from './token';
export * from './pair';
export * from './factory';
export * from './eth';