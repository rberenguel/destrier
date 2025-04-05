export { SensorHint, RangeHint };

import { Graphics } from "../../libs/3rdparty/pixi.mjs";
import { rotate } from "../base/math.js";
import { Base1 } from "../base/base.js";
import { Mesh, Meshes } from "../base/mesh.js";

class RangeHint extends Base1 {
  constructor(props) {
    const mesh = new Mesh({
      kind: Meshes.kArc,
      center: [0, 0],
      radius: props.radius,
      aperture: 0.1,
      width: 10, // TODO
      color: 0xffffff,
      fill: 0xffffff,
    });
    super({ ...props, meshes: [mesh] });

    this.e = props.e ?? 10;
    this.kind = "kRangeHint";
  }

  generate() {
    this.presentations = [];
    for (const mesh of this.meshes) {
      console.log(mesh);
      let p1 = new Graphics();
      let p2 = new Graphics();
      p1.arc(
        mesh.center[0],
        mesh.center[1],
        mesh.radius,
        -mesh.aperture / 2,
        mesh.aperture / 2,
      );
      p2.arc(
        mesh.center[0],
        mesh.center[1],
        mesh.radius,
        -mesh.aperture / 2,
        mesh.aperture / 2,
      );
      p1.lineTo(0, 0);
      p1.fill(mesh.fill);
      p2.stroke({ color: mesh.color, width: mesh.width ?? 0 });
      p1.rotation = this.r;
      p1.alpha = 0.2;
      p2.rotation = this.r;
      p2.alpha = 0.7;

      this.presentations.push(p1);
      this.presentations.push(p2);
    }
    this.generated = true;
    this.visible = true;
  }

  destroy() {
    for (let presentation of this.presentations) {
      presentation.destroy();
    }
    super.destroy();
    this.destroyed = true;
  }

  update(delta) {
    super.update(delta);
    super.move(delta.deltaTime);

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
      if (this.tint) {
        presentation.tint = this.tint;
      }
    }
  }
}

class SensorHint extends Base1 {
  constructor(props) {
    const mesh = new Mesh({
      kind: Meshes.kLine,
      vertices: [
        [-props.size, 0],
        [props.size, 0],
      ],
      width: 10, // TODO
      color: 0xffcccc,
    });
    super({ ...props, meshes: [mesh] });

    this.e = props.e ?? 10;
    this.kind = "kSensorHint";
  }

  generate() {
    this.presentations = [];
    for (const mesh of this.meshes) {
      let p = new Graphics();
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
        p.pivot.x = (mesh.vertices[1][0] + mesh.vertices[0][0]) / 2;
        p.pivot.y = (mesh.vertices[1][1] + mesh.vertices[0][1]) / 2;
        p.rotation = this.r;
      }
      this.presentations.push(p);
    }
    this.generated = true;
  }

  update(delta) {
    super.update(delta);
    super.move(delta.deltaTime);

    for (let presentation of this.presentations) {
      if (this.visible) {
        presentation.alpha = 1;
      } else {
        presentation.alpha = 0;
      }
      if (!presentation) {
        this.presentation = { destroyed: true };
        return;
      }
      if (presentation.destroyed) {
        this.presentation = { destroyed: true };
        return;
      }
      presentation.rotation = this.r;
    }
  }
}
