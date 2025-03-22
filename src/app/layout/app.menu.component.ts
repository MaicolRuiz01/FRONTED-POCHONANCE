import { OnInit } from '@angular/core';
import { Component } from '@angular/core';
import { LayoutService } from './service/app.layout.service';

@Component({
    selector: 'app-menu',
    templateUrl: './app.menu.component.html'
})
export class AppMenuComponent implements OnInit {

    model: any[] = [];

    constructor(public layoutService: LayoutService) { }

    ngOnInit() {
        this.model = [
            {
                label: 'Home',
                items: [
                    { label: 'Dashboard', icon: 'pi pi-fw pi-home', routerLink: ['/'] }
                ]
            },
            {
                label: 'SECCIONES DE LA APLICACION',
                items: [
                    {
                        label: 'CUENTAS', icon: 'pi pi-fw pi-users',
                        items: [
                            {
                                label: 'SALDOS', icon: 'pi pi-fw pi-wallet',
                                routerLink: ['/cuentas/saldos']
                            },
                            {
                                label: 'TRASPASOS', icon: 'pi pi-fw pi-arrow-right-arrow-left',
                                routerLink: ['/cuentas/traspasos']
                            },
                            {
                              label: 'COMPRAS', icon: 'pi pi-fw pi-tag',
                              routerLink: ['/cuentas/compras']
                           },
                           {
                            label: 'P2P', icon: 'pi pi-fw pi-dollar',
                            routerLink: ['/cuentas/p2p']
                           },
                           {
                            label: 'VENTAS GENERALES', icon: 'pi pi-fw pi-tags',
                            routerLink: ['/cuentas/ventasgenerales']
                           },
                           {
                            label: 'IMPUESTOS', icon: 'pi pi-fw pi-calculator',
                            routerLink: ['/cuentas/impuestos']
                           },
                           {
                            label: 'TRX', icon: 'pi pi-fw pi-prime',
                            routerLink: ['/cuentas/trx']
                           },
                        ]
                    },
                    {
                      label: 'ASIGNAR', icon: 'pi pi-fw pi-address-book',
                      items: [
                        {
                          label: 'Compras', icon: 'pi pi-fw pi-inbox',
                          routerLink: ['/ventas/asignar/compras']
                      },
                          {
                              label: 'Ventas P2P', icon: 'pi pi-fw pi-dollar',
                              routerLink: ['/ventas/asignar/p2p']
                          },
                          {
                              label: 'Ventas', icon: 'pi pi-fw pi-list-check',
                              routerLink: ['/ventas/completas']
                          },
                      ]
                  },
                    {
                        label: 'BALANCE', icon: 'pi pi-fw pi-chart-line',
                        items: [
                            {
                                label: 'CAJA', icon: 'pi pi-fw pi-box',
                                routerLink: ['/balance/caja']
                            },
                            {
                                label: 'VERIFICACION', icon: 'pi pi-fw pi-check-square',
                                routerLink: ['/balance/completas']
                            },
                        ]
                    },
                    {
                        label: 'GASTOS', icon: 'pi pi-fw pi-briefcase',
                        items: [
                            {
                                label: 'OPERATIVO', icon: 'pi pi-fw pi-building',
                                routerLink: ['/gastos/operativo']
                            },
                            {
                                label: 'OTRO', icon: 'pi pi-fw pi-bookmark',
                                routerLink: ['/gastos/otro']
                            },
                        ]
                    },
                    {
                        label: 'CRIPTOS', icon: 'pi pi-fw pi-bitcoin',
                        items: [
                            {
                                label: 'COMPLETADA', icon: 'pi pi-fw pi-check',
                                routerLink: ['/cripto/completada']
                            },
                            {
                                label: 'ABIERTAS', icon: 'pi pi-fw pi-eye',
                                routerLink: ['/cripto/vista']
                            },
                        ]
                    }

                ]
            },
            {
                label: 'Pages',
                icon: 'pi pi-fw pi-briefcase',
                items: [
                    {
                        label: 'Nueva Vista',  // ✅ Nuevo botón en el menú
                        icon: 'pi pi-fw pi-star',
                        routerLink: ['/nueva-vista']
                    },
                    {
                        label: 'Landing',
                        icon: 'pi pi-fw pi-globe',
                        routerLink: ['/landing']
                    },
                ]
            },
            {
                label: 'UI Components',
                items: [
                    { label: 'Form Layout', icon: 'pi pi-fw pi-id-card', routerLink: ['/uikit/formlayout'] },
                    { label: 'Input', icon: 'pi pi-fw pi-check-square', routerLink: ['/uikit/input'] },
                    { label: 'Float Label', icon: 'pi pi-fw pi-bookmark', routerLink: ['/uikit/floatlabel'] },
                    { label: 'Invalid State', icon: 'pi pi-fw pi-exclamation-circle', routerLink: ['/uikit/invalidstate'] },
                    { label: 'Button', icon: 'pi pi-fw pi-box', routerLink: ['/uikit/button'] },
                    { label: 'Table', icon: 'pi pi-fw pi-table', routerLink: ['/uikit/table'] },
                    { label: 'List', icon: 'pi pi-fw pi-list', routerLink: ['/uikit/list'] },
                    { label: 'Tree', icon: 'pi pi-fw pi-share-alt', routerLink: ['/uikit/tree'] },
                    { label: 'Panel', icon: 'pi pi-fw pi-tablet', routerLink: ['/uikit/panel'] },
                    { label: 'Overlay', icon: 'pi pi-fw pi-clone', routerLink: ['/uikit/overlay'] },
                    { label: 'Media', icon: 'pi pi-fw pi-image', routerLink: ['/uikit/media'] },
                    { label: 'Menu', icon: 'pi pi-fw pi-bars', routerLink: ['/uikit/menu'], routerLinkActiveOptions: { paths: 'subset', queryParams: 'ignored', matrixParams: 'ignored', fragment: 'ignored' } },
                    { label: 'Message', icon: 'pi pi-fw pi-comment', routerLink: ['/uikit/message'] },
                    { label: 'File', icon: 'pi pi-fw pi-file', routerLink: ['/uikit/file'] },
                    { label: 'Chart', icon: 'pi pi-fw pi-chart-bar', routerLink: ['/uikit/charts'] },
                    { label: 'Misc', icon: 'pi pi-fw pi-circle', routerLink: ['/uikit/misc'] }
                ]
            },
            {
                label: 'Prime Blocks',
                items: [
                    { label: 'Free Blocks', icon: 'pi pi-fw pi-eye', routerLink: ['/blocks'], badge: 'NEW' },
                    { label: 'All Blocks', icon: 'pi pi-fw pi-globe', url: ['https://www.primefaces.org/primeblocks-ng'], target: '_blank' },
                ]
            },
            {
                label: 'Utilities',
                items: [
                    { label: 'PrimeIcons', icon: 'pi pi-fw pi-prime', routerLink: ['/utilities/icons'] },
                    { label: 'PrimeFlex', icon: 'pi pi-fw pi-desktop', url: ['https://www.primefaces.org/primeflex/'], target: '_blank' },
                ]
            },
            {
                label: 'Pages',
                icon: 'pi pi-fw pi-briefcase',
                items: [
                    {
                        label: 'Landing',
                        icon: 'pi pi-fw pi-globe',
                        routerLink: ['/landing']
                    },
                    {
                        label: 'Auth',
                        icon: 'pi pi-fw pi-user',
                        items: [
                            {
                                label: 'Login',
                                icon: 'pi pi-fw pi-sign-in',
                                routerLink: ['/auth/login']
                            },
                            {
                                label: 'Error',
                                icon: 'pi pi-fw pi-times-circle',
                                routerLink: ['/auth/error']
                            },
                            {
                                label: 'Access Denied',
                                icon: 'pi pi-fw pi-lock',
                                routerLink: ['/auth/access']
                            }
                        ]
                    },
                    {
                        label: 'Crud',
                        icon: 'pi pi-fw pi-pencil',
                        routerLink: ['/pages/crud']
                    },
                    {
                        label: 'Timeline',
                        icon: 'pi pi-fw pi-calendar',
                        routerLink: ['/pages/timeline']
                    },
                    {
                        label: 'Not Found',
                        icon: 'pi pi-fw pi-exclamation-circle',
                        routerLink: ['/notfound']
                    },
                    {
                        label: 'Empty',
                        icon: 'pi pi-fw pi-circle-off',
                        routerLink: ['/pages/empty']
                    },
                ]
            },
            {
                label: 'Hierarchy',
                items: [
                    {
                        label: 'Submenu 1', icon: 'pi pi-fw pi-bookmark',
                        items: [
                            {
                                label: 'Submenu 1.1', icon: 'pi pi-fw pi-bookmark',
                                items: [
                                    { label: 'Submenu 1.1.1', icon: 'pi pi-fw pi-bookmark' },
                                    { label: 'Submenu 1.1.2', icon: 'pi pi-fw pi-bookmark' },
                                    { label: 'Submenu 1.1.3', icon: 'pi pi-fw pi-bookmark' },
                                ]
                            },
                            {
                                label: 'Submenu 1.2', icon: 'pi pi-fw pi-bookmark',
                                items: [
                                    { label: 'Submenu 1.2.1', icon: 'pi pi-fw pi-bookmark' }
                                ]
                            },
                        ]
                    },
                    {
                        label: 'Submenu 2', icon: 'pi pi-fw pi-bookmark',
                        items: [
                            {
                                label: 'Submenu 2.1', icon: 'pi pi-fw pi-bookmark',
                                items: [
                                    { label: 'Submenu 2.1.1', icon: 'pi pi-fw pi-bookmark' },
                                    { label: 'Submenu 2.1.2', icon: 'pi pi-fw pi-bookmark' },
                                ]
                            },
                            {
                                label: 'Submenu 2.2', icon: 'pi pi-fw pi-bookmark',
                                items: [
                                    { label: 'Submenu 2.2.1', icon: 'pi pi-fw pi-bookmark' },
                                ]
                            },
                        ]
                    }
                ]
            },
            {
                label: 'Get Started',
                items: [
                    {
                        label: 'Documentation', icon: 'pi pi-fw pi-question', routerLink: ['/documentation']
                    },
                    {
                        label: 'View Source', icon: 'pi pi-fw pi-search', url: ['https://github.com/primefaces/sakai-ng'], target: '_blank'
                    }
                ]
            }
        ];
    }
}
