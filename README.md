Aby uruchomić projekt, należy:
Pobrać obraz docker node.js ( docker pull node:alpine). Następnie trzeba uruchomić docker z montowaniem udziału sieciowego( docker run -itd -v C:/sciezka/do/repozytorium:/opt/project --rm sha256:<hash-obrazu>
). Dalej uruchamiamy kontener (docker exec -it <nazwa-kontenera> /bin/sh ).
Następnie mamy zainstalować pakiety worker_threads i blessed dla node.js (npm i worker_threads) oraz (npm i blessed).
Po tym wszystkim wystarczy udać się do folderu z plikiem main.mjs i wpisać (node main.mjs)
