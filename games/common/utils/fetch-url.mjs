export default class FetchUrl extends Phaser.Loader.File {
  constructor(loader, key, url, onLoadComplete) {
    super(loader, {
      type: 'json',
      key: key,
      url: url
    });
    this.onLoadComplete = onLoadComplete;
  }

  load() {
    fetch(this.url)
      .then(res => res.json())
      .then(data => {
        this.data = data;
        this.onLoadComplete(data);
        this.onLoad();
      })
      .catch(err => {
        console.error('Fetch failed:', err);
        this.onError();
      });
  }

  onLoad() {
    this.loader.cacheManager.json.add(this.key, this.data);
    this.loader.nextFile(this, true);
  }

  onError() {
    this.loader.nextFile(this, false);
  }
}