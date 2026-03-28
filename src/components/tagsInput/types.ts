import type { ComponentPropsWithoutRef } from 'react';

export type TagsInputInputProps = Omit<
  ComponentPropsWithoutRef<'input'>,
  'type' | 'value' | 'onChange' | 'defaultValue'
> & {
  defaultValue?: string;
};

export type TagsInputProps = {
  tags: string[];
  onTagsChange?: (values: string[]) => void;
  onAddTag?: (value: string) => void;
  onRemoveTag?: (value: string) => void;
  containerClassName?: string;
  className?: string;
  tagClassName?: string;
  inputProps?: TagsInputInputProps;
};
