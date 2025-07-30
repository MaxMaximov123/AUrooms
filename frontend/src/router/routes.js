const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('pages/IndexPage.vue'),
  },
  {
    path: '/room/:roomCode',
    name: 'room',
    component: () => import('pages/IndexPage.vue'),
  }
  // {
  //   path: '/:catchAll(.*)*',
  //   component: () => import('pages/ErrorNotFound.vue')
  // }
]

export default routes
