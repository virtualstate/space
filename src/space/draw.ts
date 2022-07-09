import {BlendedSpaceIndex, Space} from "./space";
import {
    PerspectiveCamera,
    Scene,
    WebGLRenderer,
    LineBasicMaterial,
    Mesh,
    BoxGeometry,
    PointLight,
    DoubleSide,
    MeshPhongMaterial,
    EdgesGeometry, Group, LineSegments, Vector3, BufferGeometry, Line, MeshBasicMaterial
} from "three";
import * as GLModule from "gl";
import {ParametricGeometries} from "three/examples/jsm/geometries/ParametricGeometries.js";
import SphereGeometry = ParametricGeometries.SphereGeometry;

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
    const width = 1024,
        height = 1024;
    const info = createContext(width, height);
    const { material, meshMaterial, render, scene, camera} = info;


    const [
        boxWidth,
        boxHeight,
        boxDepth
    ] = space.dimensions

    // const geometry = new BufferGeometry().setFromPoints( points );
    // const line = new Line(geometry, material);

    // scene.add(line)

    camera.position.set(boxWidth / 2, boxHeight / 2, boxDepth * 4);

    const group = new Group();

    console.log({ boxWidth, boxHeight, boxDepth });
    const whiteLine = new LineBasicMaterial({
        color: 0xffffff
    });

    for (const { source, target } of blended) {

        const sphereGeometry = new SphereGeometry(5, 5, 5);
        const redMesh = new MeshBasicMaterial({ color: 0xff0000 });
        const sphere = new Mesh(sphereGeometry, redMesh);

        sphere.position.set(
            source.point.dimensions[0],
            source.point.dimensions[1],
            source.point.dimensions[2]
        );

        group.add(sphere);

        const points = [
            new Vector3(
                source.point.dimensions[0],
                source.point.dimensions[1],
                source.point.dimensions[2]
            ),
            new Vector3(
                target.point.dimensions[0],
                target.point.dimensions[1],
                target.point.dimensions[2]
            ),
        ];

        const lineGeometry = new BufferGeometry().setFromPoints(points);

        const line = new Line(lineGeometry, whiteLine);
        line.position.set(0, 0, 0);

        group.add(line);
    }

    const box = new BoxGeometry(boxWidth, boxHeight, boxDepth);
    const edges = new EdgesGeometry(box);
    const cube = new LineSegments(edges, whiteLine);
    cube.position.set(boxWidth / 2, boxHeight / 2, boxDepth / 2);

    group.add(cube);

    group.position.set(0, 0, 0);
    group.rotation.x = -0.35;
    group.rotation.y = -0.35;
    scene.add(group);


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