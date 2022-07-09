import {BlendedSpaceIndex, Space} from "./space";
import {
    PerspectiveCamera,
    Scene,
    WebGLRenderer,
    LineBasicMaterial,
    Mesh,
    BoxGeometry, PointLight, DoubleSide, MeshPhongMaterial
} from "three";
import * as GLModule from "gl";
import {TextGeometry} from "three/examples/jsm/geometries/TextGeometry.js";
import {FontLoader} from "three/examples/jsm/loaders/FontLoader.js";
import OptimerBold from "three/examples/fonts/optimer_bold.typeface.json" assert { type: "json" };

const { default: gl } = GLModule;

await import("./navigator");

function createContext(width: number, height: number) {
    const scene = new Scene();
    const context = gl(width, height, {

    });
    const renderer = new WebGLRenderer({
        canvas: ({
            addEventListener() {},
            style: {},
        }) as unknown as Element,
        context,
    })
    renderer.setSize(width, height);
    const camera = new PerspectiveCamera(
        45,
        width / height,
        1,
        500
    );

    // Defaults
    camera.position.set(0, 0, 150);
    camera.lookAt(10, 0, 0);

    const meshMaterial = new MeshPhongMaterial( { color: 0x156289, emissive: 0x072534, side: DoubleSide, flatShading: true } );
    const material = new LineBasicMaterial( { color: 0xffffff } );

    const lights = [];
    lights[ 0 ] = new PointLight( 0xffffff, 1, 0 );
    lights[ 1 ] = new PointLight( 0xffffff, 1, 0 );
    lights[ 2 ] = new PointLight( 0xffffff, 1, 0 );

    lights[ 0 ].position.set( 0, 200, 0 );
    lights[ 1 ].position.set( 100, 200, 100 );
    lights[ 2 ].position.set( - 100, - 200, - 100 );

    scene.add( lights[ 0 ] );
    scene.add( lights[ 1 ] );
    scene.add( lights[ 2 ] );

    return {
        lights,
        meshMaterial,
        material,
        renderer,
        camera,
        scene,
        context,
        width,
        height,
        render() {
            renderer.render(scene, camera);
        }
    } as const;
}

export function draw(space: Space, blended: BlendedSpaceIndex[]) {
    const width = 500,
        height = 500;
    const info = createContext(width, height);
    const { material, meshMaterial, render, scene} = info;

    const fontLoader = new FontLoader();

    const font = fontLoader.parse(OptimerBold);

    // const geometry = new BufferGeometry().setFromPoints( points );
    // const line = new Line(geometry, material);

    // scene.add(line)

    const text = new TextGeometry("Hello world", {
        font: font,
        size: 10,
        height: 2,
        curveSegments: 2,
        // bevelEnabled: true,
        // bevelThickness: 10,
        // bevelSize: 8,
        // bevelOffset: 0,
        // bevelSegments: 5
    })

    const textMesh = new Mesh(text, material);

    const box = new BoxGeometry(10, 10, 10);
    const cube = new Mesh( box, meshMaterial );
    cube.rotation.x = 0.55;
    cube.rotation.y = 0.25;
    scene.add(cube);
    //
    textMesh.position.x = -30
    // textMesh.position.y = 40;
    textMesh.position.z = 10;
    //
    textMesh.rotation.x = 3;
    textMesh.rotation.y = 0;

    scene.add(textMesh);

    render();

    return {
        ...info
    } as const
}

export async function drawToFile(space: Space, blended: BlendedSpaceIndex[], file: string) {
    const { context, width, height } = draw(space, blended);
    const { createWriteStream } = await import("node:fs");
    const stream = createWriteStream(file);
    const buffer = Buffer.alloc(width * height * 4)
    context.readPixels(0, 0, width, height, context.RGBA, context.UNSIGNED_BYTE, buffer)
    if (file.endsWith(".ppm")) {
        stream.write(`P3\n# gl.ppm\n${width} ${height}\n255\n`);
        for (let index = 0; index < buffer.length; index += 4) {
            stream.write(`${buffer[index]} ${buffer[index + 1]} ${buffer[index + 2]} `);
        }
    } else if (file.endsWith(".png")) {
        const { PNG } = await import("pngjs");
        const png = new PNG({
            width,
            height
        });
        for (let index = 0; index < buffer.length; index += 4) {
            png.data[index] = buffer[index];
            png.data[index + 1] = buffer[index + 1];
            png.data[index + 2] = buffer[index + 2];
            png.data[index + 3] = buffer[index + 3];
        }

        const pack = png.pack();
        const promise = new Promise((resolve, reject) => {
            pack.on("end", resolve)
            pack.on("error", reject);
        });
        pack.pipe(stream);
        await promise;
    }
    const {promisify} = await import("util");
    await promisify(stream.close).call(stream);
}