import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Upload, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  accept?: string;
  folder?: string;
}

const ImageUploadInput = ({
  value,
  onChange,
  placeholder = "Image URL or upload",
  accept = "image/*",
  folder = "projects",
}: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const onPick = async (file: File) => {
    setUploading(true);
    const ext = file.name.split(".").pop() || "bin";
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from("project-media").upload(path, file, {
      cacheControl: "31536000",
      upsert: false,
    });
    setUploading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    const { data } = supabase.storage.from("project-media").getPublicUrl(path);
    onChange(data.publicUrl);
    toast.success("Uploaded");
  };

  return (
    <div className="flex gap-2 items-center w-full">
      <Input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(f);
          e.target.value = "";
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
      </Button>
    </div>
  );
};

export default ImageUploadInput;
