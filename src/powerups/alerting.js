export { SensorHint };

import { Graphics } from "../../libs/3rdparty/pixi.mjs";
import { rotate } from "../base/math.js";
import { Base1 } from "../base/base.js";
import { Mesh, Meshes } from "../base/mesh.js";

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
