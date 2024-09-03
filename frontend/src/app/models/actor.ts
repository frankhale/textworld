import { Dialog } from "./dialog";
import { Entity } from "./entity";
import { Race } from "./race";
import { Stats } from "./stats";
import { VendorItem } from "./vendor-item";

export interface Actor extends Entity, Storage {
    dialog?: Dialog[] | null;
    vendor_items?: VendorItem[] | null;
    killable?: boolean;
    flags: string[];
    stats?: Stats;
    race?: Race; // TODO: Currently not being used
}
