import { Graphics } from "../../libs/3rdparty/pixi.mjs";
import { Base1 } from "./base.js";
import { Mesh, Meshes } from "./mesh.js";

export { Debris, kinds };

const kinds = {
  kShipDebris: "kShipDebris",
  kAsteroidDebris: "kAsteroidDebris",
};

class Debris extends Base1 {
  constructor(props = {}) {
    super({ ...props });
    this.kind = props.kind;
    this.vertices = props.vertices;
    const mesh = this.getMesh();
    this.meshes = mesh;
    this.e = 1000;
    this.decay = 0.01;
    this.width = props.width
    this.color = props.color
  }

  getMesh() {
    let meshes = [];
    if (this.kind === kinds.kShipDebris) {
      for (let i = 1; i < this.vertices.length; i++) {
        const v0 = this.vertices[i - 1];
        const v1 = this.vertices[i];
        const mesh = new Mesh({
          kind: Meshes.kPoly,
          vertices: [[v0, v1]],
          color: this.color ?? 0xffffff,
          fill: this.fill,
          width: this.width ?? 10,
        });
        meshes.push(mesh);
      }
    }
    return meshes;
  }

  generate() {
    this.presentations = [];
    for (const mesh of this.meshes) {
      let p = new Graphics();
      if (mesh.kind === Meshes.kPoly) {
        p.poly(mesh.flatten());
        if (mesh.fill !== undefined) {
          p.fill(mesh.fill);
        }
        if (mesh.width) {
          p.stroke({ color: mesh.color, width: mesh.width ?? 0 });
        }
      }
      console.log(p, mesh)
      this.presentations.push(p);
    }
    this.generated = true;
  }

  update(delta) {
    super.update(delta);
    super.move(delta.deltaTime);
    this.e -= 0.5 * (Math.random() * this.decay + this.decay);
    const ne = Math.max(0, Math.min(1, this.e / this.initialE));
    const red = Math.floor(255 * (1 - ne)); // Cools to red
    const green = Math.floor(255 * ne);
    const blue = Math.floor(255 * ne * ne);
    const hexColor = (red << 16) | (green << 8) | blue;
    for (let presentation of this.presentations) {
      if (!presentation) {
        this.presentation = { destroyed: true };
        return;
      }
      if (presentation.destroyed) {
        this.presentation = { destroyed: true };
        return;
      }
      presentation.rotation = this.r;
      presentation.tint = hexColor;
    }
  }
}
