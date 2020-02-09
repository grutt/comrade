import {validate, validateOrReject, Contains, IsInt, Length, IsUrl, IsEmail, IsFQDN, IsDate, Min, Max} from "class-validator";


// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
window.addEventListener("DOMContentLoaded", () => {

    class Service {
        @IsUrl()
        url: string;
        icon: string;
        countRegex?: string;
    }

    interface ServiceGroup {
        services: {[key: string]: Service},
        display_name: string,
    }

    interface State {
        groups: {[key: string]: ServiceGroup}
    }

    const defaultState: State = {
        groups: {
            'feather': {
                'display_name': 'FeatherDocs',
                services: {
                    'gmail': {
                        url: 'https://gmail.com/',
                        icon: './logos/icons8-gmail-login-50.png',
                        countRegex: 'Inbox \\(([0-9]+)\\)'
                    },
                    'slack': {
                        url: 'https://acuitykm.slack.com/',
                        icon: './logos/icons8-slack-50.png',
                    },
                }
            },
            'personal': {
                display_name: 'Personal',
                services: {
                    'whatsapp': {
                        url: 'https://web.whatsapp.com/',
                        icon: './logos/icons8-whatsapp-50.png',
                    }
                }
            }
        }
    }

    const getUnreadCount = (title: string, re: RegExp = /([0-9]+)/) => {
        const res = re.exec(title)
        if (res) {
            return res[1]
        } else {
            return false;
        }
    };

    const createServiceFrame = (name: string, service: Service) => {
        const frame = document.createElement('webview')
        frame.id = name + '-frame';
        frame.setAttribute('src', service.url);
        frame.setAttribute('partition', 'persist:' + name);
        frame.setAttribute('useragent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.87 Safari/537.36')

        const frames = document.getElementById('frames');
        frames.appendChild(frame)


        frame.addEventListener('dom-ready', () => {
            setInterval(() => {
                const title = (frame as any).getTitle();
                const regex = service.countRegex ? service.countRegex : "\\(([0-9]+)\\)";
                const count = getUnreadCount(title, new RegExp(regex));
                if (count) {
                    document.getElementById(name + '-count').innerText = count;
                } else {
                    document.getElementById(name + '-count').innerText = '';
                }
            }, 500);
        })


    };

    const createServiceIcon = (name: string, service: Service, bottom=false) => {
        const selector = document.createElement('a')
        selector.id = name + '-selector';
        selector.onclick = ($event) => selectService(name);

        const logo = document.createElement('img')
        logo.setAttribute('src', service.icon);

        const count = document.createElement('span')
        count.id = name + '-count';
        selector.appendChild(logo);
        selector.appendChild(count);

        let services = document.querySelector('#services>.top');

        if(bottom) {
        services = document.querySelector('#services>.bottom');
        }
        services.appendChild(selector)
    };

    const createServiceGroup = (name: string, group: ServiceGroup) => {
        if(group.services) {
            Object.entries(group.services).forEach(([serviceKey, service]) => {
                createService(serviceKey, service);
            });
        }
    };

    const createService = (name: string, service: Service) => {
        createServiceIcon(name, service);
        createServiceFrame(name, service);
    };

    const setup = () => {
        let state = (JSON.parse(localStorage.getItem('state')) as State);
        if (!state) {
            state = defaultState;
        }

        Object.entries(state.groups).forEach(([groupKey, group]) => {
            createServiceGroup(groupKey, group)
        });


        createServiceIcon('settings', {
        icon: './logos/icons8-settings-24.png',
        url: ''
        }, true);


        document.getElementById('settings-blob').innerHTML = JSON.stringify(state, null, 4);
        document.getElementById('settings-form').onsubmit = ($event) => saveSettingsBlob($event);
    };

    setup();


    let activeElm: Element = null;
    let activeSelector: Element = null;

    const addClass = (elm: any, name: string) => {
        elm.className = [...elm.classList, name].join(' ');
    };

    const removeClass = (elm: any, name: string) => {
        elm.className = elm.className.replace(name, '');

    };

    const selectService = (service: string) => {
        if (activeElm) {
            removeClass(activeElm, 'active');
            removeClass(activeSelector, 'active');
        }

        const frame = document.getElementById(service + '-frame');
        activeElm = frame;
        addClass(frame, 'active')

        const selector = document.getElementById(service + '-selector');
        activeSelector = selector;
        addClass(selector, 'active')
    };

    const saveSettingsBlob = ($event: Event) => {
        $event.preventDefault();
        const blob = (document.getElementById('settings-blob') as HTMLInputElement).value;
        let newState: any = null;
        try {
            newState = JSON.parse(blob);
        } catch {
            alert("BAD JSON")
            return;
        }

        validateOrReject(newState)
            .then((value: any) => {
                localStorage.setItem('state', JSON.stringify(newState));
                window.location.reload();
            })
            .catch((errors: any) => {
                alert("Promise rejected (validation failed). Errors: " + JSON.stringify(errors));
            });

    };

});