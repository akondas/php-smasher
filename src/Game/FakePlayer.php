<?php

declare(strict_types=1);

namespace Smasher\Game;

use WebSocketClient\WebSocketClient;
use WebSocketClient\WebSocketClientInterface;

class FakePlayer implements WebSocketClientInterface
{
    private $client;

    private $id;

    private $x;

    private $y;

    private $ready = false;

    private $monster;

    public function onWelcome(array $data)
    {
        $this->id = uniqid();
        $this->publish('char_add', [
            'id' => $this->id,
            'x' => $this->x = random_int(10, 400),
            'y' => $this->y = random_int(10, 400),
            'heroType' => 'hero'
        ]);
        $this->call('synchronize', [], function ($result) {
            $this->monster = $result['monster'];
            $this->ready = true;
        });
        $this->subscribe('monster_add');
    }

    public function move()
    {
        if ($this->ready) {
            $this->x -= ($this->x - $this->monster['x']) > 0 ? 3 : -3;
            $this->y -= ($this->y - $this->monster['y']) > 0 ? 3 : -3;

            $this->publish('char_move', [
                'id' => $this->id,
                'x' => $this->x,
                'y' => $this->y,
                'heroType' => 'hero'
            ]);
        }
    }

    public function onEvent($topic, $message)
    {
        if($topic === 'monster_add') {
            $this->monster = $message;
        }
    }

    public function subscribe($topic)
    {
        $this->client->subscribe($topic);
    }

    public function unsubscribe($topic)
    {
        $this->client->unsubscribe($topic);
    }

    public function call($proc, $args, \Closure $callback = null)
    {
        $this->client->call($proc, $args, $callback);
    }

    public function publish($topic, $message)
    {
        $this->client->publish($topic, $message);
    }

    public function setClient(WebSocketClient $client)
    {
        $this->client = $client;
    }
}
