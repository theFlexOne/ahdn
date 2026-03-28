import { useState } from 'react';
import type { ChangeEvent, ClipboardEvent, KeyboardEvent } from 'react';
import type { TagsInputInputProps } from './types';

type UseTagsInputOptions = {
  tags: string[];
  onTagsChange?: (values: string[]) => void;
  onAddTag?: (value: string) => void;
  onRemoveTag?: (value: string) => void;
  inputProps?: TagsInputInputProps;
};

const TAG_SEPARATORS = new Set(['Enter', ',', 'Tab']);

const normalizeTag = (value: string) => value.trim().replace(/\s+/g, ' ');
const removeFirstMatchingTag = (values: string[], tagToRemove: string) => {
  const tagIndex = values.findIndex((value) => value === tagToRemove);
  if (tagIndex === -1) return values;

  return [...values.slice(0, tagIndex), ...values.slice(tagIndex + 1)];
};

export function useTagsInput({
  tags,
  onTagsChange,
  onAddTag,
  onRemoveTag,
  inputProps,
}: UseTagsInputOptions) {
  const {
    className: inputClassName,
    defaultValue = '',
    disabled = false,
    maxLength,
    onBlur,
    onFocus,
    onKeyDown,
    onPaste,
    placeholder = 'Add a tag...',
    readOnly = false,
    ...restInputProps
  } = inputProps ?? {};

  const [inputValue, setInputValue] = useState(defaultValue);

  const normalizedExistingTags = new Set(
    tags.map((tag) => normalizeTag(tag).toLowerCase()).filter(Boolean),
  );

  function getTagValue(rawValue: string) {
    const normalizedValue = normalizeTag(rawValue);
    if (!normalizedValue) return '';

    return typeof maxLength === 'number' ? normalizedValue.slice(0, maxLength) : normalizedValue;
  }

  function commitTag(rawValue: string) {
    if (disabled || readOnly || (!onTagsChange && !onAddTag)) return;

    const nextValue = getTagValue(rawValue);
    if (!nextValue || normalizedExistingTags.has(nextValue.toLowerCase())) {
      setInputValue('');
      return;
    }

    if (onTagsChange) {
      onTagsChange([...tags, nextValue]);
    } else {
      onAddTag?.(nextValue);
    }

    setInputValue('');
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    onKeyDown?.(event);

    if (event.defaultPrevented) return;

    if (TAG_SEPARATORS.has(event.key)) {
      const nextValue = getTagValue(inputValue);

      if (!nextValue) {
        if (event.key === 'Tab' || event.key === 'Enter') return;

        event.preventDefault();
        return;
      }

      event.preventDefault();
      commitTag(nextValue);
      return;
    }

    if (
      event.key === 'Backspace' &&
      !inputValue &&
      tags.length > 0 &&
      (onTagsChange || onRemoveTag) &&
      !disabled &&
      !readOnly
    ) {
      if (onTagsChange) {
        onTagsChange(tags.slice(0, -1));
      } else {
        const lastTag = tags.at(-1);
        if (lastTag) {
          onRemoveTag?.(lastTag);
        }
      }
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    onPaste?.(event);

    if (event.defaultPrevented || disabled || readOnly || (!onTagsChange && !onAddTag)) return;

    const pastedText = event.clipboardData.getData('text');
    if (!/[,\n]/.test(pastedText)) return;

    event.preventDefault();

    const existingTags = new Set(normalizedExistingTags);
    const nextTagsToAdd: string[] = [];

    for (const part of pastedText.split(/,|\n/)) {
      const nextValue = getTagValue(part);
      const normalizedValue = nextValue.toLowerCase();

      if (!nextValue || existingTags.has(normalizedValue)) {
        continue;
      }

      nextTagsToAdd.push(nextValue);
      existingTags.add(normalizedValue);
    }

    if (nextTagsToAdd.length === 0) {
      setInputValue('');
      return;
    }

    if (onTagsChange) {
      onTagsChange([...tags, ...nextTagsToAdd]);
    } else {
      nextTagsToAdd.forEach((tag) => onAddTag?.(tag));
    }

    setInputValue('');
  }

  function handleRemoveTag(tag: string) {
    if (!disabled && !readOnly) {
      if (onTagsChange) {
        const nextTags = removeFirstMatchingTag(tags, tag);
        if (nextTags !== tags) {
          onTagsChange(nextTags);
        }
        return;
      }

      onRemoveTag?.(tag);
    }
  }

  return {
    disabled,
    inputClassName,
    inputElementProps: {
      type: 'text' as const,
      value: inputValue,
      disabled,
      maxLength,
      placeholder,
      readOnly,
      onBlur,
      onChange: (event: ChangeEvent<HTMLInputElement>) => setInputValue(event.target.value),
      onFocus,
      onKeyDown: handleKeyDown,
      onPaste: handlePaste,
      spellCheck: true,
      ...restInputProps,
    },
    canRemoveTags: !!(onTagsChange || onRemoveTag) && !disabled && !readOnly,
    handleRemoveTag,
  };
}
