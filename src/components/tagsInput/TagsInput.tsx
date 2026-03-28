import { cn } from '@/lib/utils';
import { TagsInputTag } from './TagsInputTag';
import type { TagsInputProps } from './types';
import { useTagsInput } from './useTagsInput';

export function TagsInput({
  tags,
  onTagsChange,
  onAddTag,
  onRemoveTag,
  containerClassName,
  className,
  tagClassName,
  inputProps,
}: TagsInputProps) {
  const { canRemoveTags, disabled, handleRemoveTag, inputClassName, inputElementProps } =
    useTagsInput({
      tags,
      onTagsChange,
      onAddTag,
      onRemoveTag,
      inputProps,
    });

  return (
    <div className={cn('w-full max-w-[32ch] min-w-[16ch] shrink-0', containerClassName)}>
      <div
        className={cn(
          'flex min-h-9 w-full flex-wrap items-center gap-2 rounded-md bg-transparent px-3 py-2 text-sm outline-1 -outline-offset-2 outline-current transition-[color,box-shadow]',
          'focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50',
          disabled && 'cursor-not-allowed opacity-50',
          className,
        )}
      >
        <input
          {...inputElementProps}
          className={cn(
            'placeholder:text-muted-foreground min-w-24 flex-1 border-0 bg-transparent p-0 text-sm outline-none',
            'disabled:cursor-not-allowed',
            inputClassName,
          )}
        />
      </div>
      <div className="flex w-full flex-wrap justify-center gap-2 rounded-br-sm rounded-bl-sm bg-gray-500/10 p-2">
        {tags.map((tag, index) => (
          <TagsInputTag
            key={`${tag}-${index}`}
            tag={tag}
            className={tagClassName}
            onRemove={canRemoveTags ? () => handleRemoveTag(tag) : undefined}
          />
        ))}
      </div>
    </div>
  );
}

export type { TagsInputProps } from './types';
