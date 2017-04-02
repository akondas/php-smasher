<?php

require_once __DIR__ . '/../vendor/autoload.php';

$loop 			= React\EventLoop\Factory::create();
$documentRoot 	= getcwd();

$webSock = new React\Socket\Server($loop);
$webSock->listen(8181, '127.0.0.1');
$webServer = new Ratchet\Server\IoServer(
    new Ratchet\Http\HttpServer(
        new Ratchet\WebSocket\WsServer(
            new Ratchet\Wamp\WampServer(
                $gameServer = new \Smasher\Game\Server()
            )
        )
    ),
    $webSock
);

$loop->addPeriodicTimer(1, function () use ($gameServer) {
    echo sprintf("Players: %s; Memory: %s MB\n", $gameServer->getPlayersCount(), round(memory_get_usage()/1024/1024, 4));
});

$loop->run();
