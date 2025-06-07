import {isMainThread, parentPort, threadId, Worker} from 'worker_threads';
import blessed from "blessed";

//Funkcje wspólne
function random(max) {
    return Math.random() * max;
}

function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms)
    });
}

//Czas (24 godziny)
let time = 77;
let hours, minutes;


if (isMainThread) {

    const config = {
        //Liczba koparek rowna się liczbie wątków - 1
        excavator: 5,
        cars: {
            smallSize: 5,
            bigSize: 15
        },
        //Cierpliwość pierwszego w kolejce (1 to 10 minut)
        maxWaiting: 2,
        guaranteedTime: 1000,
        randomTime: 500
    };


    const carQueue = [];
    const skippedCars = [];


    function Car(id, xl) {
        this.id = id;
        this.xl = xl;
        this.waitingTime = 0;
    }

    function initialize() {

        const carsTotal = config.cars.smallSize + config.cars.bigSize;

        for (let i = 0; i < carsTotal; i++) {
            if (random(1) < 0.5 && config.cars.smallSize > 0 || config.cars.bigSize === 0) {

                carQueue.push(new Car(carsTotal - i, false));
                config.cars.smallSize--;
            } else {
                carQueue.push(new Car(carsTotal - i, true));
                config.cars.bigSize--;

            }

        }
    }

    const screen = blessed.screen({
        autoPadding: true,
        smartCSR: true
    });

    screen.title = 'Samochody i koparki';

// Detale samochodów
    const background = blessed.box({
        top: 'center',
        left: 'center',
        width: '95%',
        height: '95%',
        tags: true,
        border: {
            type: 'line'
        },
        style: {
            fg: 'white',
            bg: 'yellow',
            border: {
                fg: '#f0f0f0'
            }
        }
    });
    const road = blessed.box({
        top: 1,
        left: 'center',
        width: '95%',
        height: '40%',
        content: 'Samochody i koparki',
        tags: true,
        border: {
            type: 'line'
        },
        style: {
            fg: 'white',
            bg: 'yellow',
            border: {
                fg: '#f0f0f0'
            }
        }
    });

    function Menu(content) {
        return (blessed.box({
        top: 12,
        left: 90,
        width: '22%',
        height: '58%',
        content: content,
        tags: true,
        border: {
            type: 'line'
        },
        style: {
            fg: 'black',
            bg: 'yellow',
            border: {
                fg: '#f0f0f0'
            }
        }
    }))
        }

    function SmallCarCore(x, y, color, id) {
        return (blessed.box({
            top: y,
            left: x,
            width: '13%',
            height: '13%',
            content: `${id}`,
            tags: true,
            style: {
                fg: 'cyan',
                bg: color,
            }
        }))
    }

    function XLCarCore(x, y, color, idc) {
        return (blessed.box({
            top: y,
            left: x,
            width: '13%',
            height: '17%',
            tags: true,
            content: `${idc}`,
            style: {
                fg: 'cyan',
                bg: color,
            }
        }))
    }


    function Wheel(x, y) {
        return (blessed.box({
            top: y,
            left: x,
            width: '4%',
            height: '7%',
            tags: true,
            border: {
                type: 'line'
            },
            style: {
                bg: 'magenta',
                border: {
                    fg: '#f0f0f0'
                },
            }
        }))
    }

    function Bush1(x, y) {
        return (blessed.box({
            top: y,
            left: x,
            width: '5%',
            height: '7%',
            content: '   #\\//#/',
            tags: true,
            style: {
                bg: 'green',
                fg: 'black',
            }
        }));
    }

    function Bush2(x, y) {
        return (blessed.box({
            top: y,
            left: x,
            width: '7%',
            height: '19%',
            content: '###/#\n/#/##\n#/\\/##\\\\\n//#\\#/\\/\\    /',
            tags: true,
            style: {
                fg: 'black',
                bg: 'green',
            }
        }));
    }

    function timeBox(x, y, time) {
        return (blessed.box({
            top: y,
            left: x,
            width: '6%',
            height: '8%',
            content: time,
            tags: true,
            style: {
                fg: 'black',
                bg: 'white',
            }
        }));
    }

    function Wall(x, y) {
        return (blessed.box({
                top: y,
                left: x,
                width: '8%',
                height: '28%',
                tags: true,
                border: {
                    type: 'line'
                },
                style: {
                    bg: 'magenta',
                    border: {
                        fg: '#f0f0f0'
                    }
                }
            }
        ));
    }

    function Excavator(x, y, color) {
        return (blessed.box({
            top: y,
            left: x,
            width: '6%',
            height: '20%',
            tags: true,
            style: {
                fg: 'cyan',
                bg: color,
            }
        }))
    }

    //Całkowite tekstury
    function createCar(x, y, xl, id = 0) {
        if (xl) {
            screen.append(new XLCarCore(x, y, random(1) < 0.5 ? 'red' : 'white', id));
            screen.append(new Wheel(x + 1, y + 4));
            screen.append(new Wheel(x + 10, y + 4));
        } else {
            screen.append(new SmallCarCore(x, y, random(1) < 0.5 ? 'red' : 'white', id));
            screen.append(new Wheel(x + 1, y + 2));
            screen.append(new Wheel(x + 10, y + 2));
        }
    }


// Quit on Escape, q, or Control-C.
    screen.key(['escape', 'q', 'C-c', ''], function (ch, key) {
        return process.exit(0);
    });

// Render the screen.
    screen.render();

    initialize();
    const threads = [];
    const readyToDig = [];
    const digging = [];


//Wątki koparek
    for (let i = 0; i < config.excavator; i++) {

        threads.push(
            new Worker(new URL(import.meta.url)));

        //Nasłuchujemy kanał wątku
        threads[i].on('message', (message) => {
            //Gotów pracować dalej
            readyToDig[i] = true;
            digging[i] = false;

            // console.log(`Uzyskałem dane od wątku ${i + 1}: ${message}`);

            if (carQueue.length !== 0 && !(time > 78 && time < 84)) {
                const cars = [];
                let waiting = config.guaranteedTime;
                cars.push(carQueue.shift());
                if (cars[0].xl === true)
                    waiting *= 2;
                else if (carQueue.length !== 0 && cars[0].xl === false && carQueue[0].xl === false) {
                    cars.push(carQueue.shift());
                    waiting *= 2;
                }

                readyToDig[i] = false;
                waiting += random(config.randomTime);
                threads[i].postMessage({time: waiting});
                refreshImage();
            }
        });

    }

    // Niezmienne obiekty
    screen.append(background);
    for (let i = 0; i < 10; i++)
        screen.append(new Bush1(5 + Math.floor(random(240)) / 3, 16 + Math.floor(random(6))));
    for (let i = 0; i < 6; i++)
        screen.append(new Bush2(5 + Math.floor(random(240)) / 3, 16 + Math.floor(random(6))));

    screen.append(new Excavator(50 , 20, 'green'));

    function refreshImage() {
        // Zmieniające się obiekty
        screen.append(road);
        for (let i = 0; i < 5; i++) {
            if (carQueue[i]) {
                if (carQueue[i].xl) {
                    createCar(90 - i * 20, 5, true, carQueue[i].id);
                } else
                    createCar(90 - i * 20, 7, false, carQueue[i].id);
            }
        }
    }
    let skipped ='';


    const queueWatcher = setInterval(() => {
        if (carQueue.length === 0)
            clearInterval(queueWatcher);
        else {
            carQueue[0].waitingTime++;
            if (carQueue[0].waitingTime > config.maxWaiting) {
                skippedCars.push(carQueue.shift());
                // console.log('--------------------Samochód zrezygnował');
            }
        }
        time++;
        time = time % 144
        hours = Math.floor(time / 6 % 24);
        minutes = time % 6 * 10;
        screen.append(timeBox(4, 26, ` ${hours}:${minutes}`));
        skipped = '';
        skippedCars.forEach((car)=>{skipped +=` ${car.id}, `});
        screen.append(new Menu(`     Zrezygnowali:   ${skipped}`))
        refreshImage();
        if (time > 84 && time < 86)
            for (let m = 0; m < threads.length; m++)
                threads[m].postMessage({time: 0});

    }, 1000);


    (async () => {
        while (true) {
            if (time > 78 && time < 84) {
                screen.append(new Wall(106, 3));
            }
            await sleep(100);
            screen.render();
        }
    })();

} else {
    //Wątek koparek
    // console.log('Hey there (excavators)!' + threadId);
    let free = true;
    parentPort.on('message', async (data) => {
        // console.log(data);
        await sleep(data.time);
        parentPort.postMessage(`Wątek_${threadId}) - Skończyłem`);
    });
    parentPort.postMessage('I`m ready, broski');


}



