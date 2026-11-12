/**
 * Preparação do MapLibre, compartilhada pelos mapas do app (Mapa e minimapa).
 * Importe este módulo antes de criar um mapa: ele traz o CSS da biblioteca e
 * configura o "web worker" (arquivo à parte onde roda o trabalho pesado).
 * O ?url faz o Vite publicar o worker junto com o app e nos dar o endereço final.
 */
import 'maplibre-gl/dist/maplibre-gl.css'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import { setWorkerUrl } from 'maplibre-gl'

setWorkerUrl(workerUrl)
