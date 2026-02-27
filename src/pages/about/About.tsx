import PageHeading from "@/components/PageHeading";
import { STORAGE_ROOT_URL } from "@/constants";
import Page from "@/layout/Page";
import PageSection from "@/layout/PageSection";
import { cn } from "@/lib/utils";

export default function About() {
  return (
    <Page>
      <PageHeading>About</PageHeading>
      <PageSection className="flex flex-col gap-30">
        <Bio name="Jeff Boxell" beatleName="John Lennon" image={`${STORAGE_ROOT_URL}/bio/jeff.avif`} imageAlt="Jeff Boxell performing" floatDirection="left">
          <p className="text-gray-800 leading-relaxed">
            Jeff Boxell was born in Minneapolis, MN considers himself not just a singer but also a  song writer, performer, actor, author.  Jeff also works in public education helping children with special needs.
          </p>
          <p className="text-gray-800 leading-relaxed">
            Throughout Jeff's life he was heavily influenced by music and entertainment.  He considers it a great pleasure to work and perform as John Lennon who Jeff believes is one of the main reasons he continues to play and perform music.  However, it wasn't just the Beatles that had a huge influence in Jeff's life he also saw his artistic aspirations come from the likes of Buddy Holly, Elvis Presley, Cat Stevens, Seals & Crofts, Simon & Garfunkel, James Taylor, Jethro Tull, Rush, Pink Floyd, and more.
          </p>
          <p className="text-gray-800 leading-relaxed">
            Jeff started singing when he was just 3 years old often singing what ever his mom was playing while she often worked on art of her own.  Jeff then picked up a guitar when he was 9 when he received a new steel string acoustic. At age 12 Jeff started singing and playing publicly often on the streets of Minneapolis. He then began to tour nationally as a rock group singing and playing bass and guitar from 1980 – Present. The bands Jeff has toured with throughout his musical career include “The Crow River Ga's”, “Casa Blanca”, “World A”, “Chaser”, “No Warning”, “Ecstatic”, Wise Guy”, “The Ba's All American Band”, “The Sh's Tribute Band”, and currently “A Hard Da's Night Tribute Band”.
          </p>
          <p className="text-gray-800 leading-relaxed">
            Jeff has also had the privilege of playing with a lot of well known acts including groups such as “The Carpenters”, “Slave Raider”, “Lemont Cranston”, Daisy Dillman”, “Chameleon”, “Head East”, “S' Wolf / Star Wolf”, “Austin Healy”, “Jonny Holmes Band”, “Robbie Vee”, “Billie McLuaghlin”, “Tony Andreason”, “Jet”, “John Ford Coley”, “The Hollies”, “Frank Sinatra Jr.”, and “Rick Derringer”.
          </p>
          <p className="text-gray-800 leading-relaxed">
            When asked why he still does it after all these years he was quoted as saying, “I've always loved The Beatles. I joined A Hard Da's Night four years ago, and ha't looked back. I co't ask to work with a more talented and professional group of musicians, and aspire to keep the music we pay tribute to alive for our future generations.”
          </p>
        </Bio>
        <Bio name="Joe Covert" beatleName="Paul McCartney" image={`${STORAGE_ROOT_URL}/bio/joe.avif`} imageAlt="Joe Covert performing" floatDirection="right">
          <p className="text-gray-800 leading-relaxed">
            The leader of A Hard Day's Night, Joe Covert is an experienced thirty year veteran of the music business.  He was born and raised in South Minneapolis where his grandfather, Ray Covert, worked as a professional musician before touring the world with the USO during the Second World War. The elder Covert had a steady gig at the Warwick Hotel in New York City, the place where the Beatles stayed before performing on the Ed Sullivan Show.  Joe still has stacks of his grandfather's old promotional material.  Some of Joe's earliest memories are of listening to his grandfather sing and play guitar.
          </p>
          <p className="text-gray-800 leading-relaxed">
            Joe was fortunate to grow up in a family where music was encouraged.  His parents made sure that all six Covert children received piano lessons.  Joe had a great family, stable home and two loving parents.  This shaped him into the person he is today.  All of his childhood memories embody that warm, comfortable environment in South Minneapolis, the joy of singing Christmas carols with his siblings, the security of knowing that he was loved and valued.
          </p>
          <p className="text-gray-800 leading-relaxed">
            Joe got his first guitar at the age of 14, an electric bass guitar.  He soon hooked up with his neighborhood buddies and formed the band "Dark Earth."  This band morphed into "Bryant Avenue," an extraordinarily talented group of guys.  Joe was the beneficiary of an idyllic youth surrounded by dedicated, gifted and loyal friends.  He holds many fond memories of those days.
          </p>
          <p className="text-gray-800 leading-relaxed">
            In the early 1980s, Covert experienced one of his greatest musical epiphanies.  He was introduced to the world of busking and street musicianship, playing on Nicollet Mall and under the eaves at Calhoun Square until 2:00 AM.  Now he didn't have to scour the streets looking for gigs; he could bring the show to the people.  With guitar cases full of money and big crowds of people singing along, it was the happiest of times.  The summer nights playing music on the streets were a highlight in Covert's musical history.
          </p>
          <p className="text-gray-800 leading-relaxed">
            1986 was a watershed year for Joe because he found a band through the City Pages that was interested in playing the clubs for money.  They signed with Alpha Productions, and Covert quit his day job and worked steadily with his new group, "Ready Steady Go!"  A series of other cover bands followed, most notably, "Royal Royal" and "Wallstreet."  They were successful acts playing county fairs, corporate parties and the good clubs.
          </p>
          <p className="text-gray-800 leading-relaxed">
            By 1996, Covert had earned a teaching license and started his first job teaching high school.  One of Joe's proudest musical achievements was the formation of the "Covert Ops," a student band that played a tremendous number of shows.  Joe gave the gift of music to many teenagers.  He loved working with kids, and he keeps in touch with many of them to this day.
          </p>
          <p className="text-gray-800 leading-relaxed">
            In 2006, Covert became one of the founding members of A Hard Day's Night.  The band has played hundreds of shows all over the Midwest.  Joe has always put the Beatles on a pedestal, the best band in history and the greatest story in the history of show business.   He is passionate about the music, and he has read every Beatles biography.  This is evident in every performance.  With his bandmates, Joe creates a product second to none.
          </p>
          <p className="text-gray-800 leading-relaxed">

            The year 2016 found Joe Covert celebrating his 21st wedding anniversary with his beautiful wife Sheila Covert.  Joe loves playing Sir Paul McCartney in one of the nation's top Beatles tribute bands, but he loves his wife and two children more.  He wanted Sheila involved with the act, so he made her the band manager.  Just like the real Paul and Linda McCartney, the Coverts have never spent a night away from one another.  They bring a spirit of love to this band, and you will feel it when you experience a performance.  They love the fans and their band mates.  You will not find a more passionate and energetic Beatles tribute band.  A Hard Day's Night hopes to see you at a show soon!
          </p>

        </Bio>
        <Bio name="Aron Helm" beatleName="George Harrison" image={`${STORAGE_ROOT_URL}/bio/aron.avif`} imageAlt="Aron Helm performing" floatDirection="left">
          <p className="text-gray-800 leading-relaxed">
            Aron Helm has always had music in his life growing up with a father who was a touring musician and his mother who was an accomplished singer.  It was at a young age Aron developed his passion for music singing in the elementary school choir and even performing for US Military veterans as a trumpet player when he was only 11 years old.  Aron di't originally want to be a guitar player as his true musical passion early on was playing the drums.  Therefore, as a young boy he mainly played the drums, as well as singing at church and playing the trumpet regularly in the school band until he entered high school.  Through his teens into his early adult life Aron strayed from music and instead focused on athletics playing three sports through high school and playing four years of college baseball even getting a brief opportunity to play for the Saint Paul Saints Minor league baseball club.  Once out of college, at age 22, Aron returned to playing music and started his guitar playing by jamming on a few chords with his brother-in-law, who was a graduate at McNally Smith School of Music.  Aron quickly developed a passion for playing guitar and learning the music theory behind it.  Hence, these jams turned into band practices and before he knew it he was playing in his first rock and roll band as a rhythm guitar player and vocalist.  Though the band only lasted a few years and a few dozen gigs, it was clear to him what he wanted to do moving forward.  For the next two years Aron took time off from playing in bands to really learn the craft of playing the guitar.  He courted guitar teaching professionals who could not only guide him in the skill and technique of playing guitar, but also in the theory of music.
          </p>
          <p className="text-gray-800 leading-relaxed">
            Following some time away from playing in gigging bands Aron finally sought to get back into the performing side of music. He has since played in various local country and rock cover bands as both a lead singer and a lead guitar player.  He has played many local venues around the metro area as well as getting opportunities to play big stages at local festivals, town fairs, and even getting to grace the stages out at Winstock - a national country music festival.
          </p>
          <p className="text-gray-800 leading-relaxed">
            In the spring of 2015 Aron decided it was time for a new challenge when one of his guitar teachers informed him of an opportunity to audition for a Beatles Band as George Harrison.  Aron has been a Beatles fan ever since he was introduced to the Sgt. Pepper Album during his high school days.  His love for the band grew through watching raw videos of the band performing or reading numerous documentaries about the band.  However, if there was a Beatle he knew the least about, it was George Harrison.  While auditioning for the band, Aron quickly realized how truly unique and gifted George was as a musician and song writer. “I never knew George was so talented until I had a chance to walk in his shoes and learn to play and sing some of the wonderful songs he has written and played on”. Aron knew this was the band for him.  As George, Aron does his very best to move, walk, talk, and reproduce the iconic sounds you hear on so many of the great Beatles records, making sure to hit every note and riff as if you were seeing him play it live today.  Since joining the band officially, in May of 2015, Aron has been known to tell more than a few people, “I feel lucky to be a part of something that is so much fun and authentic, and also having the chance to play with such talented musicians alongside me".
          </p>
        </Bio>
        <Bio name="Kevin Fransen" beatleName="Ringo Starr" image={`${STORAGE_ROOT_URL}/bio/kevin.avif`} imageAlt="Kevin Fransen performing" floatDirection="right">
          <p className="text-gray-800 leading-relaxed">
            Early on, Kevin knew he would be a musician. As a boy, his walls were full of KISS posters, and his Heathkit stereo bellowed Ted Nugent and Van Halen. In 1980, he would go play pool at his friend's house, blasting a better stereo, and noticed a drum set stashed in the corner. Not knowing how to set it up, he picked up the sticks and quickly found all the sounds he needed on the vinyl couch.  "My first accomplishment was the drum solo from KISS Alive! " He bought that silver glitter bass drum, snare, and one tom with lawn mowing money.
          </p>
          <p className="text-gray-800 leading-relaxed">
            He took lessons at a local music store, played in a few bands in high school, then met Charlie Adams (Yanni).  " Charlie had a cassette, album, VHS, or magazine article about anyone that ever got paid to hit something. In half an hour, l got 2 hours worth of drum lessons. It really told me that there was more to it than just keeping time."
          </p>
          <p className="text-gray-800 leading-relaxed">
            Adams  hit the road with Yanni , so Kevin went to a music store near Chicago and Lake street  in Minneapolis to study with Rufino Ochada.  Another student, Chris Lakey,(The Lakestar) usually showed up early for his lessons, to listen in on what Kevin was working on.
          </p>
          <p className="text-gray-800 leading-relaxed">
            Kevin was learning different beats to be played as background music, with Jose Cole's circus. When that local indoor tour was over, he was invited to go on the road with Roller Brothers circus.  "You play the groove, and when they do something, hit a cowbell or a woodblock. Think about cartoons ! " 400 miles a day, the tent held 400 people, sometimes we did two shows a day.
          </p>
          <p className="text-gray-800 leading-relaxed">
            Soon after that tour ended, he expanded his resume to include country.  This band called Humming Bird played in small clubs around the Twin Cities.  While in this group his band mates would talk about his rock and roll upbringing, and along with his time in huge rooms with the circus with no microphones, he was dubbed " HEVY KEVY".  Not long after he then joined an original/cover band called Romeo Blue which morphed into Angel Eyes, then Night Lies, playing the metal rock clubs in MN and Wl.
          </p>
          <p className="text-gray-800 leading-relaxed">
            HEVY KEVY played a string of rock bands with the same bassist and guitar player,  Radio Flyer, Blasted Cactus, Bad Jack, so they were the core of each project. They formed To The Core, with Kevin on lead vocals, and rocked on for 4 years. There was another country band for a while too, Larry Loftus and the Wild Horses. This is where Kevin polished his singing chops that help him get comfortable being the main vocalist.
          </p>
          <p className="text-gray-800 leading-relaxed">
            "I took a break for 2 years, just to collect myself again. I played with Lasher, put his my group, "To The Core", back together for a while, but l just needed something else....."
          </p>
          <p className="text-gray-800 leading-relaxed">
            "A phone call from the Lasher singer put it all together. I never thought twice about The Beatles, but its perfect !  The lessons i took were coming right back to me. The jazz beats, the rhumba, the odd timing,the tambourines, cowbells, the dynamics of the circus shows, its all Ringo ! "
          </p>
          <p className="text-gray-800 leading-relaxed">
            " The biggest challenge was not learning each song, it was remembering which fill goes where. The early songs were only 2 1/2 minutes, so in 3 hours you are playing almost 80 songs ! Each album had a different snare drum sound, l love that. I really work to duplicate the sounds you know in these songs. I really have a lot of fun with this !"
          </p>
        </Bio>
      </PageSection>
    </Page >
  )
}

function Bio({ children, name, beatleName, image, floatDirection, imageAlt = "" }: { children: React.ReactNode, name: string, beatleName: string, image: string, floatDirection: "left" | "right", imageAlt?: string }) {
  return (
    <div className="clearfix [&>p:not(:last-child)]:mb-4">
      <div className={cn(
        "float-none w-full sm:w-64 mb-4 sm:mb-2 flex flex-col items-center",
        floatDirection === "left" ? "sm:float-left sm:mr-4" : "sm:float-right sm:ml-4"
      )}>
        <div className="text-center">
          <h2 className="text-3xl font-bold leading-tight">{name}</h2>
          <p className="text-lg font-semibold text-gray-700 mb-2">{`"${beatleName}"`}</p>
        </div>

        <img
          src={image}
          alt={imageAlt}
          className="w-full rounded-md"
        />
      </div>
      {children}
    </div>
  )

}