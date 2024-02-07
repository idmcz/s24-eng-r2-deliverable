"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { createBrowserSupabaseClient } from "@/lib/client-utils";
import { type Database } from "@/lib/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState, type BaseSyntheticEvent, type MouseEvent } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const kingdoms = z.enum(["Animalia", "Plantae", "Fungi", "Protista", "Archaea", "Bacteria"]);
// Use Zod to define the shape + requirements of a Species entry; used in form validation
const speciesSchema = z.object({
  scientific_name: z
    .string()
    .trim()
    .min(1)
    .transform((val) => val?.trim()),
  author: z
    .string()
    .trim()
    .min(1)
    .transform((val) => val?.trim()),
  common_name: z
    .string()
    .nullable()
    // Transform empty string or only whitespace input to null before form submission, and trim whitespace otherwise
    .transform((val) => (!val || val.trim() === "" ? null : val.trim())),
  kingdom: kingdoms,
  total_population: z.number().int().positive().min(1).nullable(),
  image: z
    .string()
    .url()
    .nullable()
    // Transform empty string or only whitespace input to null before form submission, and trim whitespace otherwise
    .transform((val) => (!val || val.trim() === "" ? null : val.trim())),
  description: z
    .string()
    .nullable()
    // Transform empty string or only whitespace input to null before form submission, and trim whitespace otherwise
    .transform((val) => (!val || val.trim() === "" ? null : val.trim())),
  endangered: z.boolean(),
});

type Species = Database["public"]["Tables"]["species"]["Row"];

export default function SpeciesDetailsDialog({ species, currentUser }: { species: Species; currentUser: string }) {
  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [authorName, setAuthorName] = useState<string | null>(null);

  useEffect(() => {
    const fetchAuthorName = async () => {
      const supabase = createBrowserSupabaseClient();

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", species.author)
          .single();

        if (error) {
          throw error;
        }

        setAuthorName(data ? data.display_name : null);
      } catch (error) {
        toast({
          title: "Error fetching author information",
          variant: "destructive",
        });
      }
    };

    if (species.author) {
      fetchAuthorName();
    }
  }, [species.author]);

  const defaultValues = {
    scientific_name: species.scientific_name,
    common_name: species.common_name,
    kingdom: species.kingdom,
    total_population: species.total_population,
    description: species.description,
    author: species.author,
    endangered: species.endangered,
  };

  type SpeciesFormValues = z.infer<typeof speciesSchema>;

  const form = useForm<SpeciesFormValues>({
    resolver: zodResolver(speciesSchema),
    defaultValues,
    mode: "onChange",
  });

  const router = useRouter();

  const onSubmit = async (input: SpeciesFormValues) => {
    // Instantiate Supabase client (for client components) and make update based on input data
    console.log("Helloooo");
    const supabase = createBrowserSupabaseClient();
    console.log(input);
    const { error } = await supabase
      .from("species")
      .update({
        scientific_name: input.scientific_name,
        common_name: input.common_name,
        kingdom: input.kingdom,
        total_population: input.total_population,
        description: input.description,
        endangered: input.endangered,
      })
      .eq("id", species.id);

    // Catch and report errors from Supabase and exit the onSubmit function with an early 'return' if an error occurred.
    if (error) {
      return toast({
        title: "Something went wrong.",
        description: error.message,
        variant: "destructive",
      });
    }
    // Because Supabase errors were caught above, the remainder of the function will only execute upon a successful edit
    setIsEditing(false);

    // Reset form values to the data values that have been processed by zod.
    // This is helpful to do after EDITING, so that the user sees any changes that have occurred during transformation
    form.reset(input);

    // Router.refresh does not affect ProfileForm because it is a client component, but it will refresh the initials in the user-nav in the event of a username change
    router.refresh();

    return toast({
      title: "Species information updated successfully!",
    });
  };

  /*These handle state changes*/
  const handleDelete = async () => {
    console.log("Hello i am deleting");
    const confirmDelete = window.confirm("Are you sure you want to delete this species?");
    if (confirmDelete) {
      // Proceed with deletion
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.from("species").delete().eq("id", species.id);

      if (error) {
        return toast({
          title: "Error deleting species",
          description: error.message,
          variant: "destructive",
        });
      }

      toast({
        title: "Species deleted successfully!",
      });

      setOpen(false);
      router.refresh();
    }
  };

  const startEditing = (e: MouseEvent) => {
    e.preventDefault();
    if (species.author !== currentUser) {
      toast({
        title: "Permission Denied",
        description: "You do not have permission to edit this species.",
        variant: "destructive",
      });
    } else setIsEditing(true);
  };

  const handleCancel = (e: MouseEvent) => {
    e.preventDefault();
    // If edit canceled, reset the form data to the original values which were set from props
    form.reset(defaultValues);
    // Turn off editing mode
    setIsEditing(false);
  };

  const handleOpen = () => {
    setOpen(true);
  };

  /*Form stuff*/
  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="secondary" onClick={handleOpen}>
            Learn More
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-screen overflow-y-auto sm:max-w-[600px]">
          <DialogHeader></DialogHeader>
          <Form {...form}>
            <form onSubmit={(e: BaseSyntheticEvent) => void form.handleSubmit(onSubmit)(e)} className="space-y-8">
              <FormField
                control={form.control}
                name="scientific_name"
                render={({ field }) => {
                  const { value, ...rest } = field;
                  return (
                    <FormItem>
                      <FormLabel>Scientific Name</FormLabel>
                      <FormControl>
                        <Input readOnly={!isEditing} placeholder={"Guinea Pig"} value={value ?? ""} {...rest} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              <FormField
                control={form.control}
                name="common_name"
                render={({ field }) => {
                  const { value, ...rest } = field;
                  return (
                    <FormItem>
                      <FormLabel>Common Name</FormLabel>
                      <FormControl>
                        <Input readOnly={!isEditing} placeholder={"Guinea Pig"} value={value ?? ""} {...rest} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              <FormField
                control={form.control}
                name="total_population"
                render={({ field }) => {
                  const { value, ...rest } = field;
                  return (
                    <FormItem>
                      <FormLabel>Total population</FormLabel>
                      <FormControl>
                        {/* Using shadcn/ui form with number: https://github.com/shadcn-ui/ui/issues/421 */}
                        <Input
                          readOnly={!isEditing}
                          type="number"
                          value={value ?? ""}
                          placeholder="300000"
                          {...rest}
                          onChange={(event) => field.onChange(+event.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => {
                  const { value, ...rest } = field;
                  return (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          readOnly={!isEditing}
                          placeholder={
                            "The guinea pig or domestic guinea pig, also known as the cavy or domestic cavy, is a species of rodent belonging to the genus Cavia in the family Caviidae."
                          }
                          value={value ?? ""}
                          {...rest}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              <FormField
                control={form.control}
                name="kingdom"
                render={({ field }) => {
                  const { value, ...rest } = field;
                  return (
                    <FormItem>
                      <FormLabel>Kingdom</FormLabel>
                      <FormControl>
                        <Input readOnly={!isEditing} placeholder={"Animala"} value={value ?? ""} {...rest} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              <FormField
                control={form.control}
                name="endangered"
                render={({ field }) => {
                  const { value, ...rest } = field;
                  return (
                    <FormItem>
                      <FormLabel>Endangered</FormLabel>
                      <FormControl>
                        <select
                          {...rest}
                          onChange={(e) => {
                            field.onChange(e.target.value === "true");
                          }}
                          disabled={!isEditing}
                        >
                          <option value="true" selected={value === true}>
                            Yes
                          </option>
                          <option value="false" selected={value === false}>
                            No
                          </option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              <FormField
                control={form.control}
                name="author"
                render={({ field }) => {
                  const { value, ...rest } = field;
                  return (
                    <FormItem>
                      <FormLabel>Author Name</FormLabel>
                      <FormControl>
                        <Input readOnly value={authorName ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              {isEditing && species.author === currentUser ? (
                <>
                  <Button type="submit" className="mr-2">
                    Update species
                  </Button>
                  <Button variant="secondary" type="button" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button variant="destructive" type="button" onClick={handleDelete}>
                    Delete Species
                  </Button>
                </>
              ) : (
                // Toggle editing mode
                <Button onClick={startEditing}>Edit Species</Button>
              )}
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
