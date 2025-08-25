import { observable, computed } from 'grainjs';

// The `markRaw` from Vue is not needed here.
// Instead, you'll need to handle the component and DOM-related logic
// outside of the store, possibly with a GrainJS component.
interface TooltipState {
  x: number;
  y: number;
  show: boolean;
  target: any;
  component: any;
  binds: any;
  width: number;
  height: number;
}

export class ChartStore {
  public readonly zoom = observable(1.0);
  public readonly pan = observable({ x: 0, y: 0 });
  public readonly ctm = observable([1, 0, 0, 1, 0, 0]);
  public readonly inverseCtm = observable([1, 0, 0, 1, 0, 0]);
  public readonly tableGroups = observable<{ [key: string]: any }>({});
  public readonly tables = observable<{ [key: string]: any }>({});
  public readonly refs = observable<{ [key: string]: any }>({});
  public readonly grid = observable({
    size: 100,
    divisions: 10,
    snap: 5
  });
  public readonly loaded = observable(false);
  public readonly tooltip = observable<TooltipState>({
    x: 0,
    y: 0,
    show: false,
    target: null,
    component: null,
    binds: null,
    width: 0,
    height: 0
  });

  public readonly subGridSize = computed((use) => use(this.grid).size / use(this.grid).divisions);
  public readonly getPan = computed((use) => use(this.pan));
  public readonly getZoom = computed((use) => use(this.zoom));
  public readonly getCTM = computed((use) => use(this.ctm));
  
  // The rest of the getters are implemented as methods.
  public getTable(tableId: string) {
    const tables = this.tables.get();
    if (!(tableId in tables)) {
      tables[tableId] = { x: 0, y: 0, width: 200, height: 32 };
      this.tables.set(tables);
    }
    return tables[tableId];
  }
  
  public getTableGroup(tableGroupId: string) {
    const tableGroups = this.tableGroups.get();
    if (!(tableGroupId in tableGroups)) {
      tableGroups[tableGroupId] = { x: 0, y: 0, width: 200, height: 32 };
      this.tableGroups.set(tableGroups);
    }
    return tableGroups[tableGroupId];
  }
  
  public getRef(refId: string) {
    const refs = this.refs.get();
    if (!(refId in refs)) {
      refs[refId] = { endpoints: [], vertices: [], auto: true };
      this.refs.set(refs);
    }
    return refs[refId];
  }
  
  public showTooltip(target: any, component: any, binds: any) {
    this.tooltip.set({
      x: target.x,
      y: target.y,
      component: component, // No need for markRaw, components are handled differently in GrainJS
      binds,
      show: true,
      target,
      width: 0,
      height: 0
    });
  }

  public hideTooltip() {
    this.tooltip.set({
      x: 0, y: 0, width: 0, height: 0,
      component: null, binds: null, show: false, target: null
    });
  }
  
  public loadDatabase(database: any) {
    // We need to access the store's methods as `this.method`
    for (const tableGroup of database.schemas[0].tableGroups) {
      this.getTableGroup(tableGroup.id);
    }
    for (const table of database.schemas[0].tables) {
      this.getTable(table.id);
    }
    for (const ref of database.schemas[0].refs) {
      this.getRef(ref.id);
    }

    this.loaded.set(true);
  }
  
  public updatePan(newPan: { x: number, y: number }) {
    this.pan.set(newPan);
  }

  public updateZoom(newZoom: number) {
    this.zoom.set(newZoom);
  }

  // The rest of the update methods
  public updateCTM(newCTM: [number, number, number, number, number, number]) {
    this.ctm.set(newCTM);
    // You'll need a different way to compute the inverse matrix if not using DOMMatrix.
    // This is an example, you would use a dedicated library for matrix math.
    // this.inverseCtm.set(new DOMMatrix(newCTM).inverse());
  }

  public updateTable(tableId: string, newTable: any) {
    this.tables.update(val => {
      val[tableId] = newTable;
      return val;
    });
  }
  
  public updateRef(refId: string, newRef: any) {
    this.refs.update(val => {
      val[refId] = newRef;
      return val;
    });
  }
}

export const chartStore = new ChartStore();