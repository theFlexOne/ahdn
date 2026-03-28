import React, { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';

type LocalTagInfo = {
  value: string;
  icon?: React.ReactNode;
  colorClassName?: string;
  disabled?: boolean;
};

type TagsInputProps = {
  tags: string[];
  onAddTag?: (value: string) => void;
  onRemoveTag?: (tag: string) => void;
  onTagClick?: (tag: string) => void;
  onInputChange?: (value: string) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  maxTagLength?: number;
  maxVisibleTagWidthClassName?: string;
  defaultInputValue?: string;
  containerClassName?: string;
  inputClassName?: string;
  tagClassName?: string;
  allowDuplicates?: boolean;
  normalizeTag?: (value: string) => string;
  addOnBlur?: boolean;
  addOnPaste?: boolean;
  separators?: string[];
  ariaLabel?: string;
  getInitialTagInfo?: (tag: string) => Omit<LocalTagInfo, 'value'> | undefined;
};

const defaultNormalizeTag = (value: string) => value.trim().replace(/\s+/g, ' ');

const buildTagKey = (tag: string, occurrence: number) => `${tag}::${occurrence}`;

const createLocalTagInfo = (
  tag: string,
  initialTagInfo?: Omit<LocalTagInfo, 'value'>,
): LocalTagInfo => ({
  value: tag,
  colorClassName: initialTagInfo?.colorClassName,
  icon: initialTagInfo?.icon,
  disabled: initialTagInfo?.disabled,
});

const reconcileLocalTagInfo = (
  tags: string[],
  previousTagInfoByKey: Record<string, LocalTagInfo>,
  getInitialTagInfo?: (tag: string) => Omit<LocalTagInfo, 'value'> | undefined,
) => {
  const nextTagInfoByKey: Record<string, LocalTagInfo> = {};
  const tagCounts = new Map<string, number>();

  for (const tag of tags) {
    const occurrence = tagCounts.get(tag) ?? 0;
    tagCounts.set(tag, occurrence + 1);

    const key = buildTagKey(tag, occurrence);
    const previousTagInfo = previousTagInfoByKey[key];

    nextTagInfoByKey[key] = previousTagInfo
      ? { ...previousTagInfo, value: tag }
      : createLocalTagInfo(tag, getInitialTagInfo?.(tag));
  }

  return nextTagInfoByKey;
};

const buildTagEntries = (tags: string[], localTagInfoByKey: Record<string, LocalTagInfo>) => {
  const tagCounts = new Map<string, number>();

  return tags.map((tag) => {
    const occurrence = tagCounts.get(tag) ?? 0;
    tagCounts.set(tag, occurrence + 1);

    const key = buildTagKey(tag, occurrence);

    return {
      key,
      value: tag,
      info: localTagInfoByKey[key] ?? createLocalTagInfo(tag),
    };
  });
};

export function TagsInput({
  tags,
  onAddTag,
  onRemoveTag,
  onTagClick,
  onInputChange,
  onKeyDown,
  placeholder = 'Add a tag...',
  disabled = false,
  readOnly = false,
  maxTagLength = 20,
  maxVisibleTagWidthClassName = 'max-w-48',
  defaultInputValue = '',
  containerClassName = '',
  inputClassName = '',
  tagClassName = '',
  allowDuplicates = false,
  normalizeTag = defaultNormalizeTag,
  addOnBlur = false,
  addOnPaste = true,
  separators = ['Enter', ',', 'Tab'],
  ariaLabel = 'Tags input',
  getInitialTagInfo,
}: TagsInputProps) {
  const [inputValue, setInputValue] = useState(defaultInputValue);
  const [isFocused, setIsFocused] = useState(false);
  const getInitialTagInfoRef = useRef(getInitialTagInfo);

  const getTagValue = (rawValue: string) => {
    const normalizedValue = normalizeTag(rawValue);
    if (!normalizedValue) return '';

    return maxTagLength ? normalizedValue.slice(0, maxTagLength) : normalizedValue;
  };

  const [localTagInfoByKey, setLocalTagInfoByKey] = useState<Record<string, LocalTagInfo>>(() =>
    reconcileLocalTagInfo(tags, {}, getInitialTagInfo),
  );

  useEffect(() => {
    setInputValue(defaultInputValue);
  }, [defaultInputValue]);

  useEffect(() => {
    getInitialTagInfoRef.current = getInitialTagInfo;
  }, [getInitialTagInfo]);

  useEffect(() => {
    setLocalTagInfoByKey((previousTagInfoByKey) =>
      reconcileLocalTagInfo(tags, previousTagInfoByKey, getInitialTagInfoRef.current),
    );
  }, [tags]);

  const normalizedExistingLabels = new Set(
    tags.map((tag) => getTagValue(tag).toLowerCase()).filter(Boolean),
  );
  const tagEntries = buildTagEntries(tags, localTagInfoByKey);

  const updateInputValue = (value: string) => {
    setInputValue(value);
    onInputChange?.(value);
  };

  const commitTag = (rawValue: string) => {
    if (disabled || readOnly || !onAddTag) return;

    const nextValue = getTagValue(rawValue);
    if (!nextValue) return;

    if (!allowDuplicates && normalizedExistingLabels.has(nextValue.toLowerCase())) {
      updateInputValue('');
      return;
    }

    onAddTag(nextValue);
    updateInputValue('');
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(event);

    if (event.defaultPrevented) return;

    if (separators.includes(event.key)) {
      if (event.key === 'Tab' && !getTagValue(inputValue)) return;

      event.preventDefault();
      commitTag(inputValue);
      return;
    }

    if (
      event.key === 'Backspace' &&
      !inputValue &&
      tags.length > 0 &&
      onRemoveTag &&
      !disabled &&
      !readOnly
    ) {
      const lastRemovableTag = [...tagEntries].reverse().find((tag) => !tag.info.disabled);
      if (lastRemovableTag) onRemoveTag(lastRemovableTag.value);
    }
  };

  const handlePaste: React.ClipboardEventHandler<HTMLInputElement> = (event) => {
    if (!addOnPaste || disabled || readOnly || !onAddTag) return;

    const pastedText = event.clipboardData.getData('text');
    if (!pastedText) return;

    const splitRegex = /,|\n/;
    if (!splitRegex.test(pastedText)) return;

    event.preventDefault();

    const parts = pastedText
      .split(splitRegex)
      .map((part) => getTagValue(part))
      .filter(Boolean);

    if (parts.length === 0) return;

    const existing = new Set(normalizedExistingLabels);

    for (const part of parts) {
      const normalizedPart = part.toLowerCase();

      if (!allowDuplicates && existing.has(normalizedPart)) {
        continue;
      }

      onAddTag(part);
      existing.add(normalizedPart);
    }

    updateInputValue('');
  };

  return (
    <div className="w-full">
      <div
        className={[
          'flex min-h-12 w-full flex-wrap items-center gap-2 rounded-2xl border bg-white px-3 py-2 shadow-sm transition',
          isFocused ? 'border-slate-400 ring-2 ring-slate-200' : 'border-slate-200',
          disabled ? 'cursor-not-allowed bg-slate-50 opacity-70' : '',
          containerClassName,
        ].join(' ')}
        onClick={(event) => {
          const input = event.currentTarget.querySelector('input');
          input?.focus();
        }}
      >
        {tagEntries.map((tag) => {
          const tagValue = tag.info.value;
          const interactive = !!onTagClick && !tag.info.disabled;

          return (
            <div
              key={tag.key}
              title={tagValue}
              className={[
                'group inline-flex h-9 max-w-full items-center gap-2 rounded-full border px-3 text-sm shadow-sm transition',
                'border-slate-200 bg-slate-100 text-slate-800',
                interactive ? 'cursor-pointer hover:bg-slate-200' : '',
                tag.info.disabled ? 'opacity-50' : '',
                tag.info.colorClassName ?? '',
                tagClassName,
              ].join(' ')}
            >
              {interactive ? (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onTagClick(tagValue);
                  }}
                  className="inline-flex min-w-0 items-center gap-2 focus:outline-none"
                >
                  {tag.info.icon ? <span className="shrink-0">{tag.info.icon}</span> : null}

                  <span className={['truncate', maxVisibleTagWidthClassName].join(' ')}>
                    {tagValue}
                  </span>
                </button>
              ) : (
                <>
                  {tag.info.icon ? <span className="shrink-0">{tag.info.icon}</span> : null}

                  <span className={['truncate', maxVisibleTagWidthClassName].join(' ')}>
                    {tagValue}
                  </span>
                </>
              )}

              {onRemoveTag && !readOnly && !disabled && !tag.info.disabled ? (
                <button
                  type="button"
                  aria-label={`Remove ${tagValue}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    onRemoveTag(tagValue);
                  }}
                  className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-300 hover:text-slate-900 focus:ring-2 focus:ring-slate-300 focus:outline-none"
                >
                  <span aria-hidden="true" className="leading-none">
                    ×
                  </span>
                </button>
              ) : null}
            </div>
          );
        })}

        <input
          type="text"
          value={inputValue}
          disabled={disabled}
          readOnly={readOnly}
          aria-label={ariaLabel}
          placeholder={placeholder}
          onChange={(event) => updateInputValue(event.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            if (addOnBlur) commitTag(inputValue);
          }}
          className={[
            'min-w-32 flex-1 bg-transparent py-1 text-sm text-slate-900 outline-none placeholder:text-slate-400',
            inputClassName,
          ].join(' ')}
        />
      </div>
    </div>
  );
}
