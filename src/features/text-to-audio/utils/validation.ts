/*
  Purpose:
    Validates user text input before allowing audio generation.
  Input:
    text (string): The text entered by the user.
    maxLimit (number, default: MAX_TEXT_CHARACTER_LIMIT): Maximum allowed characters.
  Outputs:
    ValidationErrors object containing an error message if invalid, or an empty object if valid.
  Error Handling:
    - Returns error if text is empty or only whitespace.
    - Returns error if text length exceeds the maximum allowed characters.
  Future:
    Can be expanded to detect unsupported scripts/characters or excessive profanity.
*/

import { MAX_TEXT_CHARACTER_LIMIT } from '../constants/config';
import { ValidationErrors } from '../types';

export const validateTextInput = (
  text: string,
  maxLimit: number = MAX_TEXT_CHARACTER_LIMIT
): ValidationErrors => {
  const errors: ValidationErrors = {};
  const trimmedText = text.trim();

  if (trimmedText.length === 0) {
    errors.text = 'Please enter some text to generate audio.';
    return errors;
  }

  if (text.length > maxLimit) {
    errors.text = `Text exceeds the maximum limit of ${maxLimit} characters.`;
    return errors;
  }

  return errors;
};

/*
  Purpose:
    Checks if the user input is valid without returning full error messages.
  Input:
    text (string): The text entered by the user.
    maxLimit (number, default: MAX_TEXT_CHARACTER_LIMIT): Maximum allowed characters.
  Outputs:
    boolean: true if valid, false if invalid.
  Future:
    Useful for disabling UI buttons dynamically.
*/
export const isTextInputValid = (
  text: string,
  maxLimit: number = MAX_TEXT_CHARACTER_LIMIT
): boolean => {
  const errors = validateTextInput(text, maxLimit);
  return Object.keys(errors).length === 0;
};