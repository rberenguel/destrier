export { Base1 };

import { Graphics } from "../../libs/3rdparty/pixi.mjs";

import { Meshes } from "./mesh.js";

class Base1 {
  constructor(props) {
    this.pos = {
      x: props?.pos?.x ?? 0,
      y: props?.pos?.y ?? 0,
    };
    this.vel = {
      x: props?.vel?.x ?? 0,
      y: props?.vel?.y ?? 0,
    };
    this.r = props?.r ?? 0;
    this.e = props?.e ?? 0;
    this.mass = props?.mass ?? 1;
    this.meshes = props?.meshes;
  }

  generate(unconditionally = false) {
    if (this.generated && !unconditionally) {
      return;
    }
    this.presentations = [];
    for (const mesh of this.meshes) {
      let p = new Graphics();
      if (mesh.kind === Meshes.kPoly) {
        p.poly(mesh.flatten());
        if (mesh.fill !== undefined) {
          p.fill(mesh.fill);
        }
        if (mesh.width) {
          p.stroke({
            color: mesh.color,
            width: mesh.width ?? 0,
            cap: "round",
            join: "round",
          });
        }
        if (mesh.gradienter) {
          mesh.gradienter(mesh, p)();
          p.gradienter = mesh.gradienter(mesh, p);
        }
      }
      if (mesh.kind === Meshes.kCircle) {
        p.circle(mesh.center[0], mesh.center[1], mesh.radius);
        if (mesh.width) {
          p.stroke({ color: mesh.color, width: mesh.width ?? 0 });
        }
        if (mesh.fill !== undefined) {
          p.fill(mesh.fill);
        }
        if (mesh.gradienter) {
          mesh.gradienter(mesh, p)();
          p.gradienter = mesh.gradienter(mesh, p);
        }
      }
      if (mesh.kind === Meshes.kLine) {
        p.moveTo(...mesh.vertices[0]);
        p.lineTo(...mesh.vertices[1]);
        if (mesh.width) {
          p.stroke({ color: mesh.color, width: mesh.width ?? 0 });
        }
        if (mesh.gradienter) {
          mesh.gradienter(mesh, p)();
          p.gradienter = mesh.gradienter(mesh, p);
        }
      }
      p.name = mesh.name;
      this.presentations.push(p);
    }

    this.generated = true;
  }

  attach(viewframe) {
    for (const presentation of this.presentations) {
      viewframe.presentation.addChild(presentation);
    }

    this.viewframe = viewframe;
    this.drawn = true;
  }

  move(t) {
    this.pos.x += this.vel.x * t;
    this.pos.y += this.vel.y * t;
  }

  destroy() {
    for (let presentation of this.presentations) {
      if (!presentation || presentation.destroyed) {
        continue;
      }
      presentation.destroy();
      presentation = null;
      this.generated = false;
    }
  }

  update() {
    if (this.e <= 0.1) {
      this.e = -1;
      for (let presentation of this.presentations) {
        if (!presentation || presentation.destroyed) {
          continue;
        }
        presentation.destroy();
        presentation = null;
        this.generated = false;
      }
    }
    for (let presentation of this.presentations) {
      if (presentation != null && !presentation.destroyed) {
        presentation.x = this.pos.x - this.viewframe.pos.x;
        presentation.y = this.pos.y - this.viewframe.pos.y;
      }
    }
  }
}
