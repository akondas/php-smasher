<?php

require_once __DIR__ . '/../vendor/autoload.php';

use WebSocketClient\WebSocketClient;
use Smasher\Game\FakePlayer;

$playersLimit = isset($argv[1]) ? (int) $argv[1] : 1000;
/** @var FakePlayer[] $players */
$players = [];
$loop = React\EventLoop\Factory::create();

$loop->addPeriodicTimer(0, function () use ($loop, &$players, $playersLimit) {
    if (count($players) < $playersLimit) {
        $client = new WebSocketClient($player = new FakePlayer(), $loop, '127.0.0.1', '8181');
        $players[] = $player;
    }
});

$loop->addPeriodicTimer(0.1, function () use (&$players) {
    foreach ($players as $player) {
        $player->move();
    }
});

$loop->run();
