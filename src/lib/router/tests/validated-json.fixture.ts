import { queryParam, type QueryParamSerializer } from '../query-param-serializer';

type ProfileValue = { name: string; address: { city: string } };
const json = queryParam.json<unknown>();
const isRecord = (value: unknown): value is Record<string, unknown> => {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
};
const isProfile = (value: unknown): value is ProfileValue => {
  return isRecord(value) && typeof value.name === 'string'
    && isRecord(value.address) && typeof value.address.city === 'string';
};

export const profileSerializer: QueryParamSerializer<ProfileValue> = {
  parse(values) {
    const value = json.parse(values);
    if (!isProfile(value)) throw new Error('Expected a profile with a name and address.city.');
    return value;
  },
  serialize: value => json.serialize(value),
};

export const profilesSerializer: QueryParamSerializer<ProfileValue[]> = {
  parse(values) {
    const value = json.parse(values);
    if (!Array.isArray(value) || !value.every(isProfile)) throw new Error('Expected an array of profiles.');
    return value;
  },
  serialize: value => json.serialize(value),
};
