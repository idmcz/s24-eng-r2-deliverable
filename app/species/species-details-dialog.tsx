import { type Database } from "@/lib/schema";
import { useState } from "react";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"

type Species = Database["public"]["Tables"]["species"]["Row"];

export default function SpeciesDetailsDialog ({ species }: { species: Species }) {
  const [open, setOpen] = useState<boolean>(false);

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="secondary" onClick={handleOpen}>
            <Icons.add className="mr-3 h-5 w-5" />
            Learn More
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-screen overflow-y-auto sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{species.scientific_name}</DialogTitle>
            <DialogDescription>
              {species.common_name && <p>Common name: {species.common_name}</p>}
              {species.description && <p>{species.description}</p>}
              {species.total_population && <p>Total Population: {species.total_population}</p>}
              {species.kingdom && <p>Kingdom: {species.kingdom}</p>}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}
