import { TagsInput } from '@/components/tagsInput/TagsInput';
import { useState } from 'react';

export default function TestRoute() {
  const [tags, setTags] = useState<string[]>([]);

  return (
    <div className="grid min-h-screen place-items-center bg-gray-900">
      <div className="w-[20ch] rounded-md border border-gray-200/30 p-6">
        <TagsInput
          tags={tags}
          onTagsChange={setTags}
        />
      </div>
    </div>
  );
}
