import Joi from 'joi';
import { merge, unwrapScopeData } from '.';

interface ValidatorConfig {
  allowFallback?: boolean;
  schemaOption?: Joi.ValidationOptions;
}

function dataValidator(schema: Joi.Schema, config?: ValidatorConfig) {
  return async function validator<RawData>(
    data: ReceivedData<RawData>,
    dataFallback?: Partial<RawData>
  ): Promise<Joi.ValidationResult<NonNullable<RawData>>> {
    const resolvedData = await unwrapScopeData(data);
    if (config?.allowFallback) {
      merge(resolvedData, dataFallback ?? {}, {
        allowMutation: true,
        mergeOnNonExistent: true,
      });
    }
    return schema.validate(resolvedData, config?.schemaOption);
  };
}

export default dataValidator;
