import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import mongoose from 'mongoose';

@ValidatorConstraint({ async: false })
export class IsArrayOfObjectIdsConstraint
  implements ValidatorConstraintInterface
{
  validate(value: any, args: ValidationArguments) {
    if (!Array.isArray(value)) {
      return false;
    }
    for (const item of value) {
      if (!mongoose.Types.ObjectId.isValid(item)) {
        return false;
      }
    }
    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Each element in $property must be a valid MongoDB ObjectId.';
  }
}

export function IsArrayOfObjectIds(validationOptions?: ValidationOptions) {
  return (object: Record<string, any>, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsArrayOfObjectIdsConstraint,
    });
  };
}

@ValidatorConstraint({ async: false })
export class AtLeastOnePropertyConstraint
  implements ValidatorConstraintInterface
{
  validate(object: Record<string, any>, args: ValidationArguments) {
    const requiredFields: string[] = args.constraints[0];
    for (const field of requiredFields) {
      if (object[field] !== undefined && object[field] !== null) {
        return true;
      }
    }
    return false;
  }

  defaultMessage(args: ValidationArguments) {
    const requiredFields: string[] = args.constraints[0];
    return `At least one of the following properties must be provided: ${requiredFields.join(
      ', ',
    )}`;
  }
}

export function AtLeastOneProperty(
  properties: string[],
  validationOptions?: ValidationOptions,
) {
  return function (target: any) {
    registerDecorator({
      target: target,
      propertyName: '',
      options: validationOptions,
      constraints: [properties],
      validator: AtLeastOnePropertyConstraint,
    });
  };
}

