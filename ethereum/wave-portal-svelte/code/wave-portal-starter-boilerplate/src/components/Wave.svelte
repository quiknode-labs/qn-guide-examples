<script>
  import dayjs from 'dayjs';
  export let reaction;
  export let message;
  export let waver;
  export let timestamp;
  const Reaction = {
    Wave: 0,
    Cake: 1,
    Hype: 2,
  };
  const ReactionEmojis = {
    [Reaction.Wave]: '👋',
    [Reaction.Cake]: '🍰',
    [Reaction.Hype]: '🔥',
  };
  function formatDate(timestamp) {
    return dayjs(timestamp).format('MMM D, YYYY');
  }
  function formatTime(timestamp) {
    return dayjs(timestamp).format('h:mm:ss a');
  }
</script>

<div class="wave">
  <div class="reaction">
    {ReactionEmojis[reaction]}
  </div>
  <div class="body">
    <dl>
      <dt>From:</dt>
      <dd>{waver}</dd>
      <dt>Time:</dt>
      <dd>{formatDate(timestamp)} at {formatTime(timestamp)}</dd>
    </dl>
    <div class="message">{message}</div>
  </div>
</div>

<style>
  .wave {
	position: relative;
	display: flex;
	flex-direction: column;
	gap: 20px;
	padding: 15px 10px;
	justify-content: flex-start;
	background-color: rgba(55, 65, 81, 0.8);
	border-top-left-radius: 10px;
	border-top-right-radius: 10px;
}
.reaction {
	position: absolute;
	top: 50px;
	right: 10px;
	padding: 0 10px;
	font-size: 1.5rem;
}
.body {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 10px;
}
.body dl {
	display: flex;
	flex-direction: column;
}
.body dt {
	color: #6ee7b7;
	font-weight: 500;
	font-size: 0.9rem;
}
.body dd {
	font-size: 0.85rem;
	max-width: calc(100vw - 40px);
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}
dl,
dt,
dd {
	margin: 0;
}
.message {
	margin-top: 10px;
}
@media screen and (min-width: 768px) {
	.wave {
		flex-direction: row;
	}
	.reaction {
		position: static;
		font-size: 2rem;
	}
	.body dl {
		display: grid;
		gap: 5px 10px;
		grid-template-columns: auto 1fr;
	}
	.body dt {
		font-size: 0.95rem;
	}
	.body dd {
		font-size: 0.9rem;
	}
}
</style>